"""
DB-backed Order Session Manager.
Replaces the in-memory ORDER_SESSION_STORE with PostgreSQL persistence.

All functions accept a SQLAlchemy `db` session as the first argument.
The hydration layer reconstructs Pydantic OrderSession objects so that
Dev-1 AI services remain completely unchanged.
"""

import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.order_session import OrderSessionDB
from app.models.order_session_item import OrderSessionItemDB

from app.schemas.order_session_schema import OrderSession
from app.schemas.order_item_schema import OrderItem
from app.schemas.measurement_schema import TextileMeasurement
from app.workflows.order_states import OrderState
from app.workflows.order_item_status import OrderItemStatus


# ─── Terminal states (sessions in these states are considered "closed") ───

TERMINAL_STATES = [
    OrderState.ORDER_COMPLETED.value,
    OrderState.ORDER_REJECTED.value,
    OrderState.LEDGER_UPDATED.value,
]


# ─────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────

def create_order_session(
    db: Session,
    customer_phone: str,
    items: list[TextileMeasurement],
    order_id: str | None = None,
) -> OrderSession:
    """
    Creates a new DB-backed order session after extraction succeeds.
    Returns a hydrated Pydantic OrderSession for AI logic compatibility.
    """

    if order_id is None:
        order_id = str(uuid.uuid4())

    # -------------------------------------------------
    # INTEGRITY CHECK: Ensure Customer & Order exist
    # -------------------------------------------------
    from app.models.customer import Customer
    from app.models.order import Order

    # 1. Ensure Customer exists
    customer = db.query(Customer).filter(Customer.phone_number == customer_phone).first()
    if not customer:
        # Create minimal customer if not exists (for simulation/testing)
        customer = Customer(phone_number=customer_phone, business_name="New Customer")
        db.add(customer)
        db.flush()

    # 2. Ensure Order exists
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        order = Order(
            order_id=order_id,
            customer_phone=customer_phone,
            status="initiated"
        )
        db.add(order)
        db.flush()

    # 3. Insert session row
    db_session = OrderSessionDB(
        order_id=order_id,
        customer_phone=customer_phone,
        workflow_state=OrderState.ORDER_INITIATED.value,
    )
    db.add(db_session)

    # 2. Insert item rows
    for measurement in items:
        db_item = OrderSessionItemDB(
            order_id=order_id,
            material_name=measurement.material_name,
            color=measurement.color,
            input_quantity=measurement.input_quantity,
            input_unit=measurement.input_unit,
            normalized_meters=measurement.normalized_meters,
            status=OrderItemStatus.NEGOTIATING.value,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_session)

    return hydrate_session_from_db(db, order_id)


# ─────────────────────────────────────────────
# HYDRATION (DB → Pydantic)
# ─────────────────────────────────────────────

def hydrate_session_from_db(
    db: Session,
    order_id: str,
) -> Optional[OrderSession]:
    """
    Reads DB rows and reconstructs the Pydantic OrderSession
    that Dev-1 AI services expect.
    """

    session_row = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.order_id == order_id)
        .first()
    )

    if not session_row:
        return None

    item_rows = (
        db.query(OrderSessionItemDB)
        .filter(OrderSessionItemDB.order_id == order_id)
        .all()
    )

    # Build Pydantic OrderItem list
    order_items = []
    for row in item_rows:
        measurement = TextileMeasurement(
            material_name=row.material_name,
            color=row.color,
            input_quantity=row.input_quantity,
            input_unit=row.input_unit,
            normalized_meters=row.normalized_meters,
        )

        item = OrderItem(
            item_id=str(row.session_item_id),
            measurement=measurement,
            status=OrderItemStatus(row.status),
            replaced_by=row.replaced_by,
            inventory_status=row.inventory_status,
            available_meters=row.available_meters,
            fulfilled_batches=row.fulfilled_batches,
            requested_meters=row.requested_meters,
        )
        order_items.append(item)

    # Build Pydantic OrderSession
    session = OrderSession(
        order_id=str(session_row.order_id),
        customer_phone=session_row.customer_phone,
        items=order_items,
        workflow_state=OrderState(session_row.workflow_state),
        negotiation_pending=session_row.negotiation_pending or False,
        owner_approval_required=session_row.owner_approval_required or False,
        created_at=session_row.created_at or datetime.utcnow(),
        updated_at=session_row.updated_at,
    )

    return session


# ─────────────────────────────────────────────
# QUERY
# ─────────────────────────────────────────────

def get_active_session_by_phone(
    db: Session,
    phone: str,
) -> Optional[OrderSession]:
    """
    Returns latest active (non-terminal) order session for a phone number.
    """

    session_row = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.customer_phone == phone)
        .filter(OrderSessionDB.workflow_state.notin_(TERMINAL_STATES))
        .order_by(OrderSessionDB.created_at.desc())
        .first()
    )

    if not session_row:
        return None

    return hydrate_session_from_db(db, str(session_row.order_id))


def get_session_by_order_id(
    db: Session,
    order_id: str,
) -> Optional[OrderSession]:
    """
    Fetch session using order_id.
    Needed for owner approval flow.
    """
    return hydrate_session_from_db(db, order_id)


def get_order_session(
    db: Session,
    order_id: str,
) -> Optional[OrderSession]:
    """
    Alias for backwards compatibility.
    """
    return hydrate_session_from_db(db, order_id)


# ─────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────

def update_workflow_state(
    db: Session,
    order_id: str,
    new_state: OrderState,
) -> Optional[OrderSession]:
    """
    Updates workflow state in DB.
    """

    session_row = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.order_id == order_id)
        .first()
    )

    if not session_row:
        return None

    session_row.workflow_state = new_state.value
    
    # SYNC TO MAIN ORDER TABLE
    # -------------------------
    from app.models.order import Order
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if order:
        if new_state == OrderState.ORDER_COMPLETED:
            order.status = "COMPLETED"
        elif new_state == OrderState.ORDER_REJECTED:
            order.status = "REJECTED"
        elif new_state == OrderState.WAITING_OWNER_CONFIRMATION:
            order.status = "PENDING_APPROVAL"
        
    # db.commit() REMOVED for atomicity
    db.flush() 
    db.refresh(session_row)

    return hydrate_session_from_db(db, order_id)


def set_negotiation_pending(
    db: Session,
    order_id: str,
    status: bool,
) -> None:
    """
    Sets the negotiation_pending flag.
    """

    session_row = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.order_id == order_id)
        .first()
    )

    if session_row:
        session_row.negotiation_pending = status
    if session_row:
        session_row.negotiation_pending = status
        # db.commit() REMOVED


def set_owner_approval(
    db: Session,
    order_id: str,
    status: bool,
) -> None:
    """
    Sets the owner_approval_required flag.
    """

    session_row = (
        db.query(OrderSessionDB)
        .filter(OrderSessionDB.order_id == order_id)
        .first()
    )

    if session_row:
        session_row.owner_approval_required = status
    if session_row:
        session_row.owner_approval_required = status
        # db.commit() REMOVED


# ─────────────────────────────────────────────
# SYNC ITEMS BACK TO DB
# ─────────────────────────────────────────────

def sync_session_items_to_db(
    db: Session,
    session: OrderSession,
) -> None:
    """
    After AI services mutate the Pydantic OrderSession items in memory,
    this function writes the changes back to the DB.

    Call this after every AI service call that may modify items.
    """

    for item in session.items:
        db_item = (
            db.query(OrderSessionItemDB)
            .filter(OrderSessionItemDB.session_item_id == item.item_id)
            .first()
        )

        if not db_item:
            continue

        # Sync all mutable fields
        # -------------------------------------------------
        # DATA INTEGRITY GUARD
        # -------------------------------------------------
        
        current_status = item.status.value if hasattr(item.status, 'value') else item.status
        
        # 1. If CANCELLED / REPLACED → Wipe allocations
        if current_status in [OrderItemStatus.CANCELLED.value, OrderItemStatus.REPLACED.value]:
            item.fulfilled_batches = None
            item.available_meters = 0
            
        # 2. If ACCEPTED → Validate allocations exist
        elif current_status == OrderItemStatus.ACCEPTED.value:
            if not item.fulfilled_batches:
                # If AI accepted but didn't assign batches -> Critical Error
                # We revert to NEGOTIATING to be safe, or raise Error?
                # Raising error is safer to prevent bad state.
                raise ValueError(f"Item {item.item_id} is ACCEPTED but has no fulfilled_batches.")
                
            # Validate structure
            for batch in item.fulfilled_batches:
                if "batch_id" not in batch:
                    raise ValueError(f"Invalid batch data in item {item.item_id}: {batch}")

        # -------------------------------------------------
        # SYNC TO DB
        # -------------------------------------------------

        db_item.status = current_status
        db_item.replaced_by = item.replaced_by
        db_item.inventory_status = item.inventory_status
        db_item.available_meters = item.available_meters
        db_item.fulfilled_batches = item.fulfilled_batches
        db_item.requested_meters = item.requested_meters
        db_item.material_name = item.measurement.material_name
        db_item.color = item.measurement.color
        db_item.normalized_meters = item.measurement.normalized_meters

    # db.commit() REMOVED for atomicity
