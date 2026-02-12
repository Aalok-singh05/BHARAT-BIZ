from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.gst_config import GSTConfig


DEFAULT_GST_RATE = Decimal("0.05")  # Fallback if no DB config exists


def get_gst_rate(db: Session, category: str = "default") -> Decimal:
    """
    Fetch GST rate for a category from DB.
    Falls back to 'default' category, then to hardcoded fallback.
    """
    config = (
        db.query(GSTConfig)
        .filter(GSTConfig.category == category)
        .first()
    )

    if config:
        return Decimal(str(config.gst_rate))

    # Try fallback 'default' category
    if category != "default":
        default_config = (
            db.query(GSTConfig)
            .filter(GSTConfig.category == "default")
            .first()
        )
        if default_config:
            return Decimal(str(default_config.gst_rate))

    return DEFAULT_GST_RATE


def set_gst_rate(db: Session, category: str, rate: Decimal) -> GSTConfig:
    """
    Set or update GST rate for a category.
    """
    config = (
        db.query(GSTConfig)
        .filter(GSTConfig.category == category)
        .first()
    )

    if config:
        config.gst_rate = rate
    else:
        config = GSTConfig(category=category, gst_rate=rate)
        db.add(config)

    db.commit()
    db.refresh(config)
    return config


def get_all_gst_rates(db: Session) -> list:
    """
    Return all configured GST rates.
    """
    return db.query(GSTConfig).all()
