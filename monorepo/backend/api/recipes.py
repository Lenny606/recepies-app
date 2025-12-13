from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from ..domain.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, Visibility
from ..domain.user import UserInDB
from ..services.recipe_service import RecipeService
from ..repository.recipe_repository import RecipeRepository
from .deps import get_current_user, get_recipe_repo

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
    # We might want to allow viewing without auth for public recipes.
    # But `get_current_user` raises 401. 
    # Let's try to support public view without auth.
    # We'll rely on the service to check visibility.
    # If no user token is provided, we pass None as user_id.
    # But FastAPI dependencies are strict.
    # We'll make two endpoints or use a custom dependency.
    # Let's force auth for now for detailed view to keep it simple, OR implement `get_current_user_optional`.
    current_user: UserInDB = Depends(get_current_user), 
    recipe_repo: RecipeRepository = Depends(get_recipe_repo)
):
    service = RecipeService(recipe_repo)
    return await service.get_recipe(recipe_id, current_user.id)

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
