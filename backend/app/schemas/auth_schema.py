from pydantic import BaseModel

class UserSignup(BaseModel):
    email: str
    password: str
    businessName: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class OrderRequest(BaseModel):
    message: str