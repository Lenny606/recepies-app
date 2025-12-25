from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Recipe App API"
    
    # MongoDB
    MONGO_DB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "recipe_app"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI (Gemini via OpenAI Library)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "https://recepies-app-ten.vercel.app"]

    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
