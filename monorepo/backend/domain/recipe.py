from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum

class Visibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"

class Ingredient(BaseModel):
    name: str
    amount: Optional[str] = ""
    unit: Optional[str] = None

    @field_validator("amount", mode="before")
    @classmethod
    def ensure_string_amount(cls, v: Any) -> str:
        if v is None:
            return ""
        return str(v)

class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    steps: Optional[List[str]] = []
    ingredients: Optional[List[Ingredient]] = []
    tags: Optional[List[str]] = []
    visibility: Optional[Visibility] = Visibility.PRIVATE
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    web_url: Optional[str] = None

class RecipeCreate(RecipeBase):
    should_scrape: Optional[bool] = False

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[str]] = []
    ingredients: Optional[List[Ingredient]] = []
    tags: Optional[List[str]] = []
    visibility: Optional[Visibility] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    web_url: Optional[str] = None

class RecipeInDB(RecipeBase):
    id: Optional[str] = Field(None, alias="_id")
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class RecipeResponse(RecipeInDB):
    pass
