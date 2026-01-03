from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class IngredientsRequest(BaseModel):
    ingredients: List[str]
