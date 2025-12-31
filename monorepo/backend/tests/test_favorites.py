import pytest
from fastapi.testclient import TestClient
from tests.utils import (
    create_test_recipe_data,
    register_and_login
)

@pytest.mark.integration
async def test_list_favorite_recipes(client: TestClient, clean_db):
    """Test authenticated user can see their favorite recipes."""
    auth_data = await register_and_login(client)
    
    # 1. Create a public recipe
    recipe_data = create_test_recipe_data(visibility="public")
    response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data["headers"]
    )
    assert response.status_code == 201
    recipe_id = response.json()["_id"]
    
    # 2. Favorite the recipe
    fav_response = client.post(
        f"/api/v1/recipes/{recipe_id}/favorite",
        headers=auth_data["headers"]
    )
    assert fav_response.status_code == 200
    assert fav_response.json()["is_favorite"] is True
    
    # 3. Check favorites list count
    list_response = client.get(
        "/api/v1/recipes/favorites",
        headers=auth_data["headers"]
    )
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data) == 1
    assert data[0]["_id"] == recipe_id

@pytest.mark.integration
async def test_favorites_count_initially_zero(client: TestClient, clean_db):
    """Test favorites list is empty for new user."""
    auth_data = await register_and_login(client)
    
    response = client.get(
        "/api/v1/recipes/favorites",
        headers=auth_data["headers"]
    )
    assert response.status_code == 200
    assert len(response.json()) == 0
