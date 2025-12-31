import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from repository.recipe_repository import RecipeRepository
from domain.recipe import RecipeInDB, Visibility
from datetime import datetime

async def verify_favorite_feature():
    # Setup
    mongo_url = os.getenv("MONGO_DB_URL", "mongodb+srv://db_user:AqybM6waTChDdWJM@cluster0.fg3jc65.mongodb.net/?appName=Cluster0")
    client = AsyncIOMotorClient(mongo_url)
    db = client.recipe_app_test  # Use a test DB
    repo = RecipeRepository(db)
    
    user_id = "test_user_123"
    
    # 1. Create a test recipe
    recipe_in = RecipeInDB(
        title="Test Favorite Recipe",
        author_id="author_123",
        visibility=Visibility.PUBLIC,
        favorite_by=[]
    )
    created_recipe = await repo.create(recipe_in)
    recipe_id = created_recipe.id
    print(f"Created recipe: {recipe_id}")
    
    # 2. Toggle favorite on (Add)
    print(f"Toggling favorite ON for user {user_id}")
    success = await repo.toggle_favorite(recipe_id, user_id)
    assert success is True
    
    updated_recipe = await repo.get_by_id(recipe_id)
    assert user_id in updated_recipe.favorite_by
    print("Favorite added successfully.")
    
    # 3. Toggle favorite off (Remove)
    print(f"Toggling favorite OFF for user {user_id}")
    success = await repo.toggle_favorite(recipe_id, user_id)
    assert success is True
    
    updated_recipe = await repo.get_by_id(recipe_id)
    assert user_id not in updated_recipe.favorite_by
    print("Favorite removed successfully.")
    
    # Cleanup
    await db.recipes.delete_one({"_id": created_recipe.id})
    print("Cleanup done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_favorite_feature())
