from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = datetime.utcnow()

    class Config:
        populate_by_name = True

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
