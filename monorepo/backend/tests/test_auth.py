import pytest
from fastapi.testclient import TestClient
from tests.utils import create_test_user_data, create_test_admin_data


@pytest.mark.integration
def test_register_user(client: TestClient, clean_db):
    """Test successful user registration."""
    user_data = create_test_user_data()
    
    response = client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["is_active"] is True
    assert data["role"] == "user"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.integration
def test_register_duplicate_email(client: TestClient, clean_db):
    """Test registration with duplicate email fails."""
    user_data = create_test_user_data(email="test@example.com")
    
    # First registration
    response1 = client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 200
    
    # Second registration with same email
    response2 = client.post("/api/v1/auth/register", json=user_data)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"].lower()


@pytest.mark.integration
def test_login_success(client: TestClient, clean_db):
    """Test successful login with valid credentials."""
    user_data = create_test_user_data()
    
    # Register user
    client.post("/api/v1/auth/register", json=user_data)
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_data["email"],
            "password": user_data["password"]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.integration
def test_login_invalid_password(client: TestClient, clean_db):
    """Test login with incorrect password fails."""
    user_data = create_test_user_data()
    
    # Register user
    client.post("/api/v1/auth/register", json=user_data)
    
    # Login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_data["email"],
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.integration
def test_login_nonexistent_user(client: TestClient, clean_db):
    """Test login with non-existent user fails."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "somepassword"
        }
    )
    
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.integration
def test_refresh_token(client: TestClient, clean_db):
    """Test token refresh flow."""
    user_data = create_test_user_data()
    
    # Register and login
    client.post("/api/v1/auth/register", json=user_data)
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_data["email"],
            "password": user_data["password"]
        }
    )
    
    access_token = login_response.json()["access_token"]
    
    # Refresh token
    response = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.integration
def test_register_with_invalid_email(client: TestClient, clean_db):
    """Test registration with invalid email format."""
    user_data = create_test_user_data()
    user_data["email"] = "not-an-email"
    
    response = client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 422  # Validation error
