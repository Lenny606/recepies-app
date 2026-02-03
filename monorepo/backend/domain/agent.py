from pydantic import BaseModel, Field, conlist
from typing import Optional, List, Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=2000)

class ConsultRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., max_items=20)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class IngredientsRequest(BaseModel):
    ingredients: List[str]
