from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from ..repository.recipe_repository import RecipeRepository
from ..domain.recipe import RecipeCreate, RecipeUpdate, RecipeInDB, RecipeResponse, Visibility

class RecipeService:
    def __init__(self, recipe_repo: RecipeRepository):
        self.recipe_repo = recipe_repo

    async def create_recipe(self, recipe_in: RecipeCreate, author_id: str) -> RecipeResponse:
        new_recipe = RecipeInDB(
            **recipe_in.model_dump(),
            author_id=author_id
        )
        created_recipe = await self.recipe_repo.create(new_recipe)
        return RecipeResponse(**created_recipe.model_dump(by_alias=True))

    async def get_recipe(self, recipe_id: str, current_user_id: Optional[str] = None) -> RecipeResponse:
        recipe = await self.recipe_repo.get_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Access control
        if recipe.visibility == Visibility.PRIVATE and recipe.author_id != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this recipe")
            
        return RecipeResponse(**recipe.model_dump(by_alias=True))

    async def update_recipe(self, recipe_id: str, update_in: RecipeUpdate, current_user_id: str) -> RecipeResponse:
        recipe = await self.recipe_repo.get_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
            
        if recipe.author_id != current_user_id:
             raise HTTPException(status_code=403, detail="Not authorized to update this recipe")
        
        update_data = update_in.model_dump(exclude_unset=True)
        if not update_data:
            return RecipeResponse(**recipe.model_dump(by_alias=True))
            
        update_data["updated_at"] = datetime.utcnow()
        await self.recipe_repo.update(recipe_id, update_data)
        
        updated_recipe = await self.recipe_repo.get_by_id(recipe_id)
        return RecipeResponse(**updated_recipe.model_dump(by_alias=True))

    async def delete_recipe(self, recipe_id: str, current_user_id: str) -> bool:
        recipe = await self.recipe_repo.get_by_id(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
            
        if recipe.author_id != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this recipe")
            
        return await self.recipe_repo.delete(recipe_id)

    async def list_recipes(
        self, 
        current_user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        search_query: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[RecipeResponse]:
        # Logic: 
        # 1. If searching public recipes (no user logged in), return only public.
        # 2. If user logged in, return public + their private ones.
        # However, listing "all" mixed might be complex for a simple query.
        # Simplified Vibe approach:
        # - Default list: Public recipes only.
        # - "My Recipes": Logged in user's recipes (private + public).
        
        # For now, let's implement a generic search that prioritizes public, 
        # unless we explicitly ask filter by author.
        # Actually, let's make it simple: 
        # If user is logged in, they can see everything public + their own private.
        # But `get_all` in repo is building a query.
        # Let's adjust service to use `get_all` effectively, maybe just returning Public for main feed.
        
        # Strategy:
        # Main Feed: Public recipes.
        # User Library: Filter by author_id (current_user).
        
        # For this method, let's assume it's the "Search / Feed" method.
        # It defaults to public only.
        
        public_recipes = await self.recipe_repo.get_all(
            skip=skip, 
            limit=limit, 
            public_only=True,
            search_query=search_query,
            tags=tags
        )
        
        return [RecipeResponse(**r.model_dump(by_alias=True)) for r in public_recipes]

    async def list_my_recipes(
        self,
        current_user_id: str,
        skip: int = 0,
        limit: int = 100,
        search_query: Optional[str] = None
    ) -> List[RecipeResponse]:
        my_recipes = await self.recipe_repo.get_all(
            skip=skip,
            limit=limit,
            author_id=current_user_id,
            public_only=False, # Show my private ones too
            search_query=search_query
        )
        return [RecipeResponse(**r.model_dump(by_alias=True)) for r in my_recipes]
