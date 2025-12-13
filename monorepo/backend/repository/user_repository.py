from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, List
from domain.user import UserInDB, UserCreate, UserUpdate

class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users

    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        user_doc = await self.collection.find_one({"email": email})
        if user_doc:
            user_doc["_id"] = str(user_doc["_id"])
            return UserInDB(**user_doc)
        return None

    async def get_by_id(self, user_id: str) -> Optional[UserInDB]:
        try:
            oid = ObjectId(user_id)
        except:
            return None
            
        user_doc = await self.collection.find_one({"_id": oid})
        if user_doc:
            user_doc["_id"] = str(user_doc["_id"])
            return UserInDB(**user_doc)
        return None

    async def create_user(self, user: UserInDB) -> UserInDB:
        user_dict = user.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(user_dict)
        user.id = str(result.inserted_id)
        return user

    async def update_user(self, user_id: str, update_data: dict) -> bool:
        try:
            oid = ObjectId(user_id)
        except:
            return False

        result = await self.collection.update_one(
            {"_id": oid},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def get_all(self, limit: int = 100, skip: int = 0) -> List[UserInDB]:
        users = []
        cursor = self.collection.find().skip(skip).limit(limit)
        async for user_doc in cursor:
            user_doc["_id"] = str(user_doc["_id"])
            users.append(UserInDB(**user_doc))
        return users
