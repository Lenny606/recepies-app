from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..domain.user import UserResponse, UserInDB
from ..repository.user_repository import UserRepository
from .deps import get_current_active_user, get_current_admin_user, get_user_repo

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return current_user

@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: UserInDB = Depends(get_current_admin_user),
    user_repo: UserRepository = Depends(get_user_repo)
):
    users = await user_repo.get_all(skip=skip, limit=limit)
    return users
