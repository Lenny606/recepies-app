from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from services.auth_service import AuthService
from repository.user_repository import UserRepository
from domain.user import UserCreate, UserResponse, UserInDB
from api.deps import get_user_repo, get_current_user
from core.ratelimit import limiter

router = APIRouter()

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_in: UserCreate, 
    user_repo: UserRepository = Depends(get_user_repo)
):
    auth_service = AuthService(user_repo)
    return await auth_service.register_user(user_in)

@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepository = Depends(get_user_repo)
):
    auth_service = AuthService(user_repo)
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_service.create_tokens(user)
    
class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_token(
    request_data: RefreshRequest,
    user_repo: UserRepository = Depends(get_user_repo)
):
    # Use our helper logic directly or extract it to a dependency if preferred. 
    # For simplicity here, we validate the refresh token and issue new ones.
    from api.deps import get_current_user_from_refresh_token
    
    current_user = await get_current_user_from_refresh_token(
        token=request_data.refresh_token,
        user_repo=user_repo
    )
    
    auth_service = AuthService(user_repo)
    return auth_service.create_tokens(current_user)
