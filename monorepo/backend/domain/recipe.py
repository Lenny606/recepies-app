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
    steps: Optional[List[str]] = []
    ingredients: Optional[List[Ingredient]] = []
    tags: Optional[List[str]] = []
    visibility: Optional[Visibility] = Visibility.PRIVATE
    video_url: Optional[str] = None

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[str]] = []
    ingredients: Optional[List[Ingredient]] = []
    tags: Optional[List[str]] = []
    visibility: Optional[Visibility] = None
    video_url: Optional[str] = None

class RecipeInDB(RecipeBase):
    id: Optional[str] = Field(None, alias="_id")
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class RecipeResponse(RecipeInDB):
    pass
