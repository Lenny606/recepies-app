from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status
from repository.recipe_repository import RecipeRepository
from domain.recipe import RecipeCreate, RecipeUpdate, RecipeInDB, RecipeResponse, Visibility, Ingredient
from services.scraping_service import ScrapingService
from services.ai_service import AIService

class RecipeService:
    def __init__(
        self, 
        recipe_repo: RecipeRepository,
        scraping_service: Optional[ScrapingService] = None,
        ai_service: Optional[AIService] = None
    ):
        self.recipe_repo = recipe_repo
        self.scraping_service = scraping_service
        self.ai_service = ai_service

    async def create_recipe(self, recipe_in: RecipeCreate, author_id: str) -> RecipeResponse:
        # If should_scrape is True and web_url is provided, use the scraping flow
        if recipe_in.should_scrape and recipe_in.web_url:
            # We reuse the logic from create_recipe_from_url but with potentially partial data
            # Actually, let's just use create_recipe_from_url if that's the intention
            return await self.create_recipe_from_url(recipe_in.web_url, author_id)

        new_recipe = RecipeInDB(
            **recipe_in.model_dump(exclude={"should_scrape"}),
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

    async def create_recipe_from_url(self, url: str, author_id: str) -> RecipeResponse:
        """
        Scrapes a URL, analyzes it with AI, and creates a recipe.
        """
        if not self.scraping_service or not self.ai_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Scraping or AI service not configured"
            )

        # 1. Scrape content
        try:
            scraped_data = await self.scraping_service.scrape_url(url)
            content = scraped_data.get("content", "")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to scrape URL: {str(e)}"
            )

        # 2. Analyze with AI
        try:
            ai_data = await self.ai_service.analyze_recipe_text(content, url)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"AI analysis failed: {str(e)}"
            )

        # 3. Create recipe entity
        try:
            # Map ingredients from AI response to Ingredient domain model
            ingredients = []
            for ing in ai_data.get("ingredients", []):
                ingredients.append(Ingredient(
                    name=ing.get("name", ""),
                    amount=ing.get("amount", ""),
                    unit=ing.get("unit")
                ))

            recipe_create = RecipeCreate(
                title=ai_data.get("title", "Imported Recipe"),
                description=ai_data.get("description"),
                steps=ai_data.get("steps", []),
                ingredients=ingredients,
                tags=ai_data.get("tags", []),
                web_url=url,
                visibility=Visibility.PUBLIC # Default to public for imported ones? or private?
            )
            
            return await self.create_recipe(recipe_create, author_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save imported recipe: {str(e)}"
            )
