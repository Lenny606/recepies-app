import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from repository.recipe_repository import RecipeRepository
from domain.recipe import RecipeInDB
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from repository.recipe_repository import RecipeRepository
from domain.recipe import RecipeInDB

async def verify_random_recipes():
    # Connect to DB
    MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_DETAILS)
    db = client.recepies_app  # Ensure this matches your DB name
    
    repo = RecipeRepository(db)
    
    # Insert some dummy public recipes if needed (for testing environment)
    # But assuming there are some, let's just try to fetch
    
    try:
        recipes = await repo.get_random(limit=5)
        print(f"Successfully fetched {len(recipes)} random recipes.")
        for r in recipes:
            print(f"- {r.title} (ID: {r.id})")
            
        if len(recipes) <= 5:
            print("Verification PASSED: Limit respected.")
        else:
            print("Verification FAILED: Returned more than limit.")
            
    except Exception as e:
        print(f"Verification FAILED: {str(e)}")

if __name__ == "__main__":
    asyncio.run(verify_random_recipes())
