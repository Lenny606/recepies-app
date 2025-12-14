import pytest
from fastapi.testclient import TestClient
from tests.utils import (
    create_test_recipe_data,
    register_and_login
)


@pytest.mark.integration
async def test_create_recipe(client: TestClient, clean_db):
    """Test authenticated user can create a recipe."""
    auth_data = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == recipe_data["title"]
    assert data["description"] == recipe_data["description"]
    assert data["visibility"] == recipe_data["visibility"]
    assert "id" in data
    assert "author_id" in data


@pytest.mark.integration
def test_create_recipe_unauthenticated(client: TestClient, clean_db):
    """Test creating recipe without authentication fails."""
    recipe_data = create_test_recipe_data()
    
    response = client.post("/api/v1/recipes/", json=recipe_data)
    
    assert response.status_code == 401


@pytest.mark.integration
async def test_list_public_recipes(client: TestClient, clean_db):
    """Test listing public recipes without authentication."""
    # Create user and public recipe
    auth_data = await register_and_login(client)
    public_recipe = create_test_recipe_data(visibility="public")
    
    client.post(
        "/api/v1/recipes/",
        json=public_recipe,
        headers=auth_data["headers"]
    )
    
    # List public recipes without auth
    response = client.get("/api/v1/recipes/")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["visibility"] == "public"


@pytest.mark.integration
async def test_list_my_recipes(client: TestClient, clean_db):
    """Test user can see their own private and public recipes."""
    auth_data = await register_and_login(client)
    
    # Create private recipe
    private_recipe = create_test_recipe_data(visibility="private")
    client.post(
        "/api/v1/recipes/",
        json=private_recipe,
        headers=auth_data["headers"]
    )
    
    # Create public recipe
    public_recipe = create_test_recipe_data(visibility="public")
    client.post(
        "/api/v1/recipes/",
        json=public_recipe,
        headers=auth_data["headers"]
    )
    
    # List my recipes
    response = client.get(
        "/api/v1/recipes/me",
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.integration
async def test_get_recipe_by_id(client: TestClient, clean_db):
    """Test getting a specific recipe by ID."""
    auth_data = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # Get recipe
    response = client.get(
        f"/api/v1/recipes/{recipe_id}",
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["_id"] == recipe_id
    assert data["title"] == recipe_data["title"]


@pytest.mark.integration
async def test_get_private_recipe_unauthorized(client: TestClient, clean_db):
    """Test that user cannot view another user's private recipe."""
    # User 1 creates private recipe
    auth_data1 = await register_and_login(client)
    recipe_data = create_test_recipe_data(visibility="private")
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data1["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # User 2 tries to access it
    auth_data2 = await register_and_login(client)
    response = client.get(
        f"/api/v1/recipes/{recipe_id}",
        headers=auth_data2["headers"]
    )
    
    assert response.status_code == 403


@pytest.mark.integration
async def test_update_recipe(client: TestClient, clean_db):
    """Test recipe owner can update their recipe."""
    auth_data = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # Update recipe
    update_data = {"title": "Updated Recipe Title"}
    response = client.put(
        f"/api/v1/recipes/{recipe_id}",
        json=update_data,
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Recipe Title"


@pytest.mark.integration
async def test_update_recipe_not_owner(client: TestClient, clean_db):
    """Test that non-owner cannot update recipe."""
    # User 1 creates recipe
    auth_data1 = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data1["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # User 2 tries to update
    auth_data2 = await register_and_login(client)
    update_data = {"title": "Hacked Title"}
    response = client.put(
        f"/api/v1/recipes/{recipe_id}",
        json=update_data,
        headers=auth_data2["headers"]
    )
    
    assert response.status_code == 403


@pytest.mark.integration
async def test_delete_recipe(client: TestClient, clean_db):
    """Test recipe owner can delete their recipe."""
    auth_data = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # Delete recipe
    response = client.delete(
        f"/api/v1/recipes/{recipe_id}",
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 204


@pytest.mark.integration
async def test_delete_recipe_not_owner(client: TestClient, clean_db):
    """Test that non-owner cannot delete recipe."""
    # User 1 creates recipe
    auth_data1 = await register_and_login(client)
    recipe_data = create_test_recipe_data()
    
    create_response = client.post(
        "/api/v1/recipes/",
        json=recipe_data,
        headers=auth_data1["headers"]
    )
    recipe_id = create_response.json()["_id"]
    
    # User 2 tries to delete
    auth_data2 = await register_and_login(client)
    response = client.delete(
        f"/api/v1/recipes/{recipe_id}",
        headers=auth_data2["headers"]
    )
    
    assert response.status_code == 403


@pytest.mark.integration
async def test_search_recipes(client: TestClient, clean_db):
    """Test recipe search functionality."""
    auth_data = await register_and_login(client)
    
    # Create recipes with specific titles
    recipe1 = create_test_recipe_data(title="Chocolate Cake", visibility="public")
    recipe2 = create_test_recipe_data(title="Vanilla Cookies", visibility="public")
    
    client.post("/api/v1/recipes/", json=recipe1, headers=auth_data["headers"])
    client.post("/api/v1/recipes/", json=recipe2, headers=auth_data["headers"])
    
    # Search for "Chocolate"
    response = client.get("/api/v1/recipes/?search=Chocolate")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "Chocolate" in data[0]["title"]


@pytest.mark.integration
async def test_filter_recipes_by_tags(client: TestClient, clean_db):
    """Test filtering recipes by tags."""
    auth_data = await register_and_login(client)
    
    # Create recipes with specific tags
    recipe1 = create_test_recipe_data(visibility="public", tags=["dessert", "sweet"])
    recipe2 = create_test_recipe_data(visibility="public", tags=["savory", "dinner"])
    
    client.post("/api/v1/recipes/", json=recipe1, headers=auth_data["headers"])
    client.post("/api/v1/recipes/", json=recipe2, headers=auth_data["headers"])
    
    # Filter by "dessert" tag
    response = client.get("/api/v1/recipes/?tags=dessert")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "dessert" in data[0]["tags"]
