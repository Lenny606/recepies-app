import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from repository.shopping_cart_repository import ShoppingCartRepository
from domain.shopping_cart import ShoppingItem

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

async def verify_shopping_cart():
    # Setup
    mongo_url = os.getenv("MONGO_DB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.recipe_app_test
    repo = ShoppingCartRepository(db)
    
    user_id = "test_user_shopping"
    
    print(f"--- Testing ShoppingCart for user {user_id} ---")
    
    # 1. Create cart
    cart = await repo.create(user_id)
    print(f"Created/Found cart: {cart.id}")
    assert cart.user_id == user_id
    
    # 2. Add items
    item1 = ShoppingItem(id="1", value="Milk")
    item2 = ShoppingItem(id="2", value="Eggs")
    
    print("Adding Milk...")
    await repo.add_item(user_id, item1)
    print("Adding Eggs...")
    await repo.add_item(user_id, item2)
    
    cart = await repo.get_by_user_id(user_id)
    assert len(cart.items) == 2
    assert cart.items[0].value == "Milk"
    assert cart.items[1].value == "Eggs"
    print("Items added successfully.")
    
    # 3. Remove item
    print("Removing Milk...")
    await repo.remove_item(user_id, "1")
    cart = await repo.get_by_user_id(user_id)
    assert len(cart.items) == 1
    assert cart.items[0].value == "Eggs"
    print("Item removed successfully.")
    
    # 4. Clear cart
    print("Clearing cart...")
    await repo.clear_cart(user_id)
    cart = await repo.get_by_user_id(user_id)
    assert len(cart.items) == 0
    print("Cart cleared successfully.")
    
    # Cleanup
    await db.shopping_carts.delete_one({"user_id": user_id})
    print("Cleanup done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_shopping_cart())
