from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from domain.recipe import RecipeCreate, RecipeUpdate, RecipeResponse, Visibility
from domain.user import UserInDB
from services.recipe_service import RecipeService
from api.deps import get_current_user, get_current_user_optional, get_recipe_service

router = APIRouter()

# Optional Auth helper can be implemented here if needed in future


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_in: RecipeCreate,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    return await service.create_recipe(recipe_in, current_user.id)

@router.post("/import", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def import_recipe_by_url(
    url: str = Query(..., description="The URL of the recipe to import"),
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """
    Import a recipe from a URL using AI scraping.
    """
    return await service.create_recipe_from_url(url, current_user.id)

@router.get("/me", response_model=List[RecipeResponse])
async def read_my_recipes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    return await service.list_my_recipes(current_user.id, skip, limit, search)

@router.get("/favorites", response_model=List[RecipeResponse])
async def read_favorite_recipes(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    return await service.list_favorite_recipes(current_user.id, skip, limit)

@router.get("/{recipe_id}", response_model=RecipeResponse)
async def read_recipe(
    recipe_id: str,
    current_user: Optional[UserInDB] = Depends(get_current_user_optional), 
    service: RecipeService = Depends(get_recipe_service)
):
    user_id = current_user.id if current_user else None
    return await service.get_recipe(recipe_id, user_id)

@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    recipe_in: RecipeUpdate,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    return await service.update_recipe(recipe_id, recipe_in, current_user.id)

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    await service.delete_recipe(recipe_id, current_user.id)

@router.post("/{recipe_id}/favorite", response_model=RecipeResponse)
async def toggle_favorite(
    recipe_id: str,
    current_user: UserInDB = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    return await service.toggle_favorite(recipe_id, current_user.id)

@router.get("/", response_model=List[RecipeResponse])
async def read_public_recipes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    current_user: Optional[UserInDB] = Depends(get_current_user_optional),
    service: RecipeService = Depends(get_recipe_service)
):
    user_id = current_user.id if current_user else None
    return await service.list_recipes(user_id, skip, limit, search, tags)
