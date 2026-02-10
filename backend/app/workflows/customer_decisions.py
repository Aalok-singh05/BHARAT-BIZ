from enum import Enum


class CustomerDecision(str, Enum):

    ACCEPT_AVAILABLE = "accept_available"
    CANCEL_ITEM = "cancel_item"
    REQUEST_ALTERNATIVE = "request_alternative"
    UNKNOWN = "unknown"
    EDIT_ITEM='edit_item'
