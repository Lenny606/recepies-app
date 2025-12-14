from motor.motor_asyncio import AsyncIOMotorClient
from core.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_DB_URL)
            # Redact credentials in log output for security
            log_url = settings.MONGO_DB_URL.split('@')[-1] if '@' in settings.MONGO_DB_URL else settings.MONGO_DB_URL
            print(f"Connected to MongoDB at {log_url}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise

    def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

    def get_db(self):
        return self.client[settings.DATABASE_NAME]

db = Database()

async def get_database():
    return db.get_db()
