from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from domain.shopping_cart import ShoppingCartInDB, ShoppingItem
from domain.user import UserInDB
from repository.shopping_cart_repository import ShoppingCartRepository
from api.deps import get_current_user, get_shopping_cart_repo

router = APIRouter()

@router.get("/me", response_model=ShoppingCartInDB)
async def get_my_cart(
    current_user: UserInDB = Depends(get_current_user),
    repo: ShoppingCartRepository = Depends(get_shopping_cart_repo)
):
    cart = await repo.get_by_user_id(current_user.id)
    if not cart:
        cart = await repo.create(current_user.id)
    return cart

@router.post("/items", response_model=ShoppingCartInDB)
async def add_item(
    item: ShoppingItem,
    current_user: UserInDB = Depends(get_current_user),
    repo: ShoppingCartRepository = Depends(get_shopping_cart_repo)
):
    cart = await repo.add_item(current_user.id, item)
    if not cart:
        # Create cart if it doesn't exist then add item
        await repo.create(current_user.id)
        cart = await repo.add_item(current_user.id, item)
        if not cart:
            raise HTTPException(status_code=400, detail="Failed to add item to cart")
    return cart

@router.delete("/items/{item_id}", response_model=ShoppingCartInDB)
async def remove_item(
    item_id: str,
    current_user: UserInDB = Depends(get_current_user),
    repo: ShoppingCartRepository = Depends(get_shopping_cart_repo)
):
    cart = await repo.remove_item(current_user.id, item_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Item not found or cart empty")
    return cart

@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: UserInDB = Depends(get_current_user),
    repo: ShoppingCartRepository = Depends(get_shopping_cart_repo)
):
    success = await repo.clear_cart(current_user.id)
    if not success:
         # It's fine if it was already empty or didn't exist, but repo returns false if modified_count == 0
         # Let's just return success regardless for now to be idempotent
         pass
    return None
