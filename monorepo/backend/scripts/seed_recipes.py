import asyncio
import json
import os
import sys
from pathlib import Path
from datetime import datetime
import argparse

# Add parent directory to sys.path to allow importing from backend modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from core.database import db
from core.config import get_settings
from repository.user_repository import UserRepository
from repository.recipe_repository import RecipeRepository
from domain.recipe import RecipeInDB, Visibility, Ingredient

async def seed_recipes(file_path: str, author_email: str):
    settings = get_settings()
    
    print(f"Connecting to MongoDB...")
    db.connect()
    database = db.get_db()
    
    user_repo = UserRepository(database)
    recipe_repo = RecipeRepository(database)
    
    print(f"Looking for author with email: {author_email}")
    author = await user_repo.get_by_email(author_email)
    
    if not author:
        print(f"Error: User with email '{author_email}' not found.")
        print("Please create the user first or provide a valid email.")
        db.close()
        return

    print(f"Author found: {author.email} (ID: {author.id})")
    
    try:
        with open(file_path, 'r') as f:
            recipes_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        db.close()
        return
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from '{file_path}'.")
        db.close()
        return

    count = 0
    for data in recipes_data:
        try:
            # Prepare recipe object
            recipe_in_db = RecipeInDB(
                _id="", # Will be set by repository after insertion
                title=data['title'],
                description=data.get('description'),
                steps=data.get('steps', []),
                ingredients=[Ingredient(**i) for i in data.get('ingredients', [])],
                tags=data.get('tags', []),
                visibility=Visibility(data.get('visibility', 'private')),
                author_id=author.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            await recipe_repo.create(recipe_in_db)
            print(f"Imported: {recipe_in_db.title}")
            count += 1
        except Exception as e:
            print(f"Failed to import recipe '{data.get('title', 'Unknown')}': {str(e)}")

    print(f"\nSuccessfully seeded {count} recipes.")
    db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database with recipes from a JSON file.")
    parser.add_argument("--file", default="data/recipes_seed.json", help="Path to the JSON seed file")
    parser.add_argument("--author", required=True, help="Email of the user who will be the author of these recipes")
    
    args = parser.parse_args()
    
    asyncio.run(seed_recipes(args.file, args.author))
