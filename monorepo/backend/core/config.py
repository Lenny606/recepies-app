from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional, Any

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Recipe App API"
    
    # MongoDB
    MONGO_DB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "recipe_app"
    
    # Security
    SECRET_KEY: str = "temporary_secret_key_for_vibe_coding"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI (Gemini via OpenAI Library)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] | str = ["http://localhost:5173", "http://localhost:3000", "https://recepies-app-ten.vercel.app"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
