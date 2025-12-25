import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("monorepo/backend/.env")

async def diagnose():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "recipe_db")
    
    print(f"Connecting to {mongodb_url} / {database_name}")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    print("\n--- Users ---")
    async for user in db.users.find().limit(5):
        print(f"User: _id={user['_id']} (type={type(user['_id'])}), email={user.get('email')}")
        
    print("\n--- Recipes ---")
    async for recipe in db.recipes.find().limit(5):
        author_id = recipe.get('author_id')
        print(f"Recipe: _id={recipe['_id']} (type={type(recipe['_id'])}), title='{recipe.get('title')}', author_id={author_id} (type={type(author_id)})")

if __name__ == "__main__":
    asyncio.run(diagnose())
