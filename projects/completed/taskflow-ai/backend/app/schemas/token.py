from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from app.schemas.user import User


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenWithUser(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: User


class TokenPayload(BaseModel):
    sub: Optional[UUID] = None
    exp: Optional[int] = None
    type: Optional[str] = None  # access or refresh


class RefreshTokenRequest(BaseModel):
    refresh_token: str