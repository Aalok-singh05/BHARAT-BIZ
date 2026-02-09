from pydantic import BaseModel

class OrderRequest(BaseModel):
    message: str
    phone: str
