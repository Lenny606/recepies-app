import asyncio
import sys
import os

# Add monorepo/backend to sys.path
sys.path.append(os.path.abspath("monorepo/backend"))

from core.database import db
from repository.user_repository import UserRepository
from repository.recipe_repository import RecipeRepository

async def diagnose():
    db.connect()
    database = db.get_db()
    
    user_repo = UserRepository(database)
    recipe_repo = RecipeRepository(database)
    
    print("\n--- Users ---")
    users = await user_repo.get_all(limit=5)
    for user in users:
        # We want to see the RAW doc if possible to see types, but repo converts it.
        # Let's access collection directly.
        raw_user = await database.users.find_one({"_id": user.id if isinstance(user.id, str) else user.id})
        # Wait, user.id in UserInDB is str (aliased to _id). 
        # But if we want to find it again, we might need ObjectId.
        
        print(f"User: id={user.id} (type={type(user.id)}), email={user.email}")
        
    print("\n--- Recipes ---")
    recipes = await recipe_repo.get_all(limit=5)
    for recipe in recipes:
        print(f"Recipe: id={recipe.id} (type={type(recipe.id)}), title='{recipe.title}', author_id={recipe.author_id} (type={type(recipe.author_id)})")
        
        # Check if author exists
        author = await user_repo.get_by_id(recipe.author_id)
        if author:
            print(f"  -> Author found: {author.email} (id={author.id})")
            if author.id == recipe.author_id:
                print("  -> ID Match: SUCCESS")
            else:
                print(f"  -> ID Match: FAIL (author.id={author.id} != recipe.author_id={recipe.author_id})")
        else:
            print(f"  -> Author NOT FOUND for author_id: {recipe.author_id}")

    db.close()

if __name__ == "__main__":
    asyncio.run(diagnose())
