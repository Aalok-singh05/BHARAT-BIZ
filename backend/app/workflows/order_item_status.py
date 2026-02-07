from enum import Enum


class OrderItemStatus(str, Enum):

    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    CANCELLED = "cancelled"
    REPLACED = "replaced"
