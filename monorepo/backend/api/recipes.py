from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from domain.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, Visibility
from domain.user import UserInDB
from services.recipe_service import RecipeService
from repository.recipe_repository import RecipeRepository
from api.deps import get_current_user, get_current_user_optional, get_recipe_repo

router = APIRouter()

# Optional Auth helper can be implemented here if needed in future


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_in: RecipeCreate,
    current_user: UserInDB = Depends(get_current_user),
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    return await service.create_recipe(recipe_in, current_user.id)

@router.get("/me", response_model=List[RecipeResponse])
async def read_my_recipes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user),
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    return await service.list_my_recipes(current_user.id, skip, limit, search)

@router.get("/{recipe_id}", response_model=RecipeResponse)
async def read_recipe(
    recipe_id: str,
    # Let's support public view without auth.
    # We'll rely on the service to check visibility.
    # If no user token is provided, we pass None as user_id.
    current_user: Optional[UserInDB] = Depends(get_current_user_optional), 
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    user_id = current_user.id if current_user else None
    return await service.get_recipe(recipe_id, user_id)

@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    current_user: UserInDB = Depends(get_current_user),
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    return await service.update_recipe(recipe_id, recipe_in, current_user.id)

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    await service.delete_recipe(recipe_id, current_user.id)

@router.get("/", response_model=List[RecipeResponse])
async def read_public_recipes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    return await service.list_recipes(None, skip, limit, search, tags)
