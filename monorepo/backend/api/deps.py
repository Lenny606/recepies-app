from fastapi import Depends, HTTPException, status
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from core.config import get_settings
from core.database import get_database
from repository.user_repository import UserRepository
from repository.recipe_repository import RecipeRepository
from repository.shopping_cart_repository import ShoppingCartRepository
from domain.user import UserInDB
from services.recipe_service import RecipeService
from services.scraping_service import ScrapingService
from services.ai_service import AIService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
settings = get_settings()

async def get_user_repo(db = Depends(get_database)) -> UserRepository:
    return UserRepository(db)

async def get_recipe_repo(db = Depends(get_database)) -> RecipeRepository:
    return RecipeRepository(db)

async def get_shopping_cart_repo(db = Depends(get_database)) -> ShoppingCartRepository:
    return ShoppingCartRepository(db)

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    user_repo: UserRepository = Depends(get_user_repo)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    user_repo: UserRepository = Depends(get_user_repo)
) -> Optional[UserInDB]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
        
    user = await user_repo.get_by_email(email)
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
    if current_user.role != "admin":
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user
async def get_current_user_from_refresh_token(
    token: str, 
    user_repo: UserRepository = Depends(get_user_repo)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user

async def get_scraping_service() -> ScrapingService:
    return ScrapingService()

async def get_ai_service(db = Depends(get_database)) -> AIService:
    repo = RecipeRepository(db)
    return AIService(recipe_repo=repo)

async def get_recipe_service(
    recipe_repo: RecipeRepository = Depends(get_recipe_repo),
    scraping_service: ScrapingService = Depends(get_scraping_service),
    ai_service: AIService = Depends(get_ai_service)
) -> RecipeService:
    return RecipeService(recipe_repo, scraping_service, ai_service)
