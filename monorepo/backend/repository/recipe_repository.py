from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId, Regex
from typing import Optional, List
from ..domain.recipe import RecipeInDB, RecipeCreate, RecipeUpdate

class RecipeRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.recipes
        # Create indexes (this should ideally be in a migration script or startup, but here for vibe coding)
        # self.collection.create_index([("title", "text"), ("description", "text"), ("tags", "text")])

    async def create(self, recipe: RecipeInDB) -> RecipeInDB:
        recipe_dict = recipe.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(recipe_dict)
        recipe.id = str(result.inserted_id)
        return recipe

    async def get_by_id(self, recipe_id: str) -> Optional[RecipeInDB]:
        try:
            oid = ObjectId(recipe_id)
        except:
            return None
            
        doc = await self.collection.find_one({"_id": oid})
        if doc:
            doc["_id"] = str(doc["_id"])
            return RecipeInDB(**doc)
        return None

    async def update(self, recipe_id: str, update_data: dict) -> bool:
        try:
            oid = ObjectId(recipe_id)
        except:
            return False

        result = await self.collection.update_one(
            {"_id": oid},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete(self, recipe_id: str) -> bool:
        try:
            oid = ObjectId(recipe_id)
        except:
            return False
            
        result = await self.collection.delete_one({"_id": oid})
        return result.deleted_count > 0

    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        author_id: Optional[str] = None,
        public_only: bool = False,
        search_query: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[RecipeInDB]:
        query = {}
        
        if author_id:
            query["author_id"] = author_id
        
        if public_only:
            # If requesting public only, we filter by visibility.
            # If author_id is present (e.g. searching someone else's recipes), valid.
            query["visibility"] = "public"
        
        if tags:
            query["tags"] = {"$all": tags}

        if search_query:
            # Simple regex search for "vibe" implementation instead of full text setup
            regex = Regex(search_query, "i")
            query["$or"] = [
                {"title": regex},
                {"description": regex},
                {"tags": regex}
            ]

        recipes = []
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            recipes.append(RecipeInDB(**doc))
        return recipes
