import pytest
from fastapi.testclient import TestClient
from tests.utils import (
    create_test_user_data,
    create_test_admin_data,
    register_and_login
)


@pytest.mark.integration
async def test_get_current_user(client: TestClient, clean_db):
    """Test getting current user profile."""
    auth_data = await register_and_login(client)
    
    response = client.get(
        "/api/v1/users/me",
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == auth_data["user"]["email"]
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.integration
def test_get_current_user_unauthenticated(client: TestClient, clean_db):
    """Test getting current user without authentication fails."""
    response = client.get("/api/v1/users/me")
    
    assert response.status_code == 401
    assert "not authenticated" in response.json()["detail"].lower()


@pytest.mark.integration
async def test_list_users_as_admin(client: TestClient, clean_db):
    """Test that admin can list all users."""
    # Create admin user
    admin_data = create_test_admin_data()
    admin_auth = await register_and_login(client, admin_data)
    
    # Create regular user
    await register_and_login(client)
    
    # Admin lists users
    response = client.get(
        "/api/v1/users/",
        headers=admin_auth["headers"]
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # At least admin and regular user


@pytest.mark.integration
async def test_list_users_as_regular_user(client: TestClient, clean_db):
    """Test that regular user cannot list all users."""
    auth_data = await register_and_login(client)
    
    response = client.get(
        "/api/v1/users/",
        headers=auth_data["headers"]
    )
    
    assert response.status_code == 400
    assert "privilege" in response.json()["detail"].lower()


@pytest.mark.integration
def test_list_users_unauthenticated(client: TestClient, clean_db):
    """Test listing users without authentication fails."""
    response = client.get("/api/v1/users/")
    
    assert response.status_code == 401
