from fastapi import HTTPException, status
from ..repository.user_repository import UserRepository
from ..domain.user import UserCreate, UserInDB, UserResponse
from ..auth.security import get_password_hash, verify_password
from ..auth.jwt import create_access_token, create_refresh_token

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register_user(self, user_create: UserCreate) -> UserResponse:
        existing_user = await self.user_repo.get_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        hashed_pw = get_password_hash(user_create.password)
        new_user = UserInDB(
            email=user_create.email,
            hashed_password=hashed_pw,
            role=user_create.role,
            is_active=user_create.is_active
        )

        created_user = await self.user_repo.create_user(new_user)
        return UserResponse(**created_user.model_dump(by_alias=True))

    async def authenticate_user(self, email: str, password: str):
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_tokens(self, user: UserInDB):
        access_token = create_access_token(data={"sub": user.email, "role": user.role})
        refresh_token = create_refresh_token(data={"sub": user.email})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
