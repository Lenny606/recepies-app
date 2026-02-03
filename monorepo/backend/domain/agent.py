from pydantic import BaseModel
from typing import Optional, List

class ChatMessage(BaseModel):
    role: str
    content: str

class ConsultRequest(BaseModel):
    messages: List[ChatMessage]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class IngredientsRequest(BaseModel):
    ingredients: List[str]
