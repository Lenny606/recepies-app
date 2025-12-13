from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class Visibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"

class Ingredient(BaseModel):
    name: str
    amount: str
    unit: Optional[str] = None

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    steps: List[str] = []
    ingredients: List[Ingredient] = []
    tags: List[str] = []
    visibility: Visibility = Visibility.PRIVATE

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[str]] = None
    ingredients: Optional[List[Ingredient]] = None
    tags: Optional[List[str]] = None
    visibility: Optional[Visibility] = None

class RecipeInDB(RecipeBase):
    id: str = Field(alias="_id")
    author_id: str
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        populate_by_name = True

class RecipeResponse(RecipeInDB):
    pass
