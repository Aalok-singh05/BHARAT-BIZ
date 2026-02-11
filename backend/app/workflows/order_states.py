from enum import Enum


class OrderState(str, Enum):
    """
    Represents the lifecycle stages of an order workflow.
    These states control how the AI agent processes conversations.
    """

    ORDER_INITIATED = "order_initiated"
    ORDER_EXTRACTED = "order_extracted"
    INVENTORY_CHECKING = "inventory_checking"
    CUSTOMER_NEGOTIATION = "customer_negotiation"
    FINAL_CUSTOMER_CONFIRMATION = "final_customer_confirmation"
    WAITING_OWNER_CONFIRMATION = "waiting_owner_confirmation"
    INVOICE_GENERATED = "invoice_generated"
    ORDER_COMPLETED = "order_completed"
    LEDGER_UPDATED = "ledger_updated"
