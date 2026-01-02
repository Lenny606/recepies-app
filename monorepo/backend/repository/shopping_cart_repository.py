from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, List
from domain.shopping_cart import ShoppingCartInDB, ShoppingItem
from datetime import datetime

class ShoppingCartRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.shopping_carts

    async def get_by_user_id(self, user_id: str) -> Optional[ShoppingCartInDB]:
        doc = await self.collection.find_one({"user_id": user_id})
        if doc:
            doc["_id"] = str(doc["_id"])
            return ShoppingCartInDB(**doc)
        return None

    async def create(self, user_id: str) -> ShoppingCartInDB:
        existing = await self.get_by_user_id(user_id)
        if existing:
            return existing
            
        cart = ShoppingCartInDB(user_id=user_id)
        cart_dict = cart.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(cart_dict)
        cart.id = str(result.inserted_id)
        return cart

    async def add_item(self, user_id: str, item: ShoppingItem) -> Optional[ShoppingCartInDB]:
        result = await self.collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"items": item.model_dump()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        if result.modified_count > 0:
            return await self.get_by_user_id(user_id)
        return None

    async def remove_item(self, user_id: str, item_id: str) -> Optional[ShoppingCartInDB]:
        result = await self.collection.update_one(
            {"user_id": user_id},
            {
                "$pull": {"items": {"id": item_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        if result.modified_count > 0:
            return await self.get_by_user_id(user_id)
        return None

    async def clear_cart(self, user_id: str) -> bool:
        result = await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "items": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
