from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ShoppingItem(BaseModel):
    id: str
    value: str

class ShoppingCartBase(BaseModel):
    items: List[ShoppingItem] = []

class ShoppingCartCreate(ShoppingCartBase):
    user_id: str

class ShoppingCartUpdate(BaseModel):
    items: Optional[List[ShoppingItem]] = None

class ShoppingCartInDB(ShoppingCartBase):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
