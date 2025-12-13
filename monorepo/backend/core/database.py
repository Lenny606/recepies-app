from motor.motor_asyncio import AsyncIOMotorClient
from core.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        print(f"Connected to MongoDB at {settings.MONGO_URI}")

    def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

    def get_db(self):
        return self.client[settings.DATABASE_NAME]

db = Database()

async def get_database():
    return db.get_db()
