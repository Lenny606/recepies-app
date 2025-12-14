import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Generator, AsyncGenerator
import asyncio

from main import app
from core.config import get_settings
from core.database import Database, get_database

settings = get_settings()

# Test database name
TEST_DATABASE_NAME = "recipe_app_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db():
    """Create a test database and clean it up after each test."""
    client = AsyncIOMotorClient(settings.MONGO_DB_URL)
    db = client[TEST_DATABASE_NAME]
    
    # Clean all collections before test
    collection_names = await db.list_collection_names()
    for collection_name in collection_names:
        await db[collection_name].delete_many({})
    
    yield db
    
    # Clean all collections after test
    collection_names = await db.list_collection_names()
    for collection_name in collection_names:
        await db[collection_name].delete_many({})
    
    client.close()


@pytest.fixture(scope="function")
async def test_app(test_db):
    """Override the get_database dependency to use test database."""
    async def override_get_database():
        return test_db
    
    app.dependency_overrides[get_database] = override_get_database
    
    yield app
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(test_app) -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(test_app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
async def clean_db(test_db):
    """Ensure database is clean before test."""
    collection_names = await test_db.list_collection_names()
    for collection_name in collection_names:
        await test_db[collection_name].delete_many({})
    yield
