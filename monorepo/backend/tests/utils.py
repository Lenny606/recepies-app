from typing import Dict
from faker import Faker
from domain.user import UserCreate
from domain.recipe import RecipeCreate, Ingredient, Visibility

fake = Faker()


def create_test_user_data(email: str = None, password: str = "testpass123") -> Dict:
    """Create test user data for registration."""
    return {
        "email": email or fake.email(),
        "password": password,
        "is_active": True,
        "role": "user"
    }


def create_test_admin_data(email: str = None, password: str = "adminpass123") -> Dict:
    """Create test admin user data."""
    return {
        "email": email or f"admin_{fake.email()}",
        "password": password,
        "is_active": True,
        "role": "admin"
    }


def get_auth_headers(token: str) -> Dict[str, str]:
    """Get authentication headers with bearer token."""
    return {"Authorization": f"Bearer {token}"}


def create_test_recipe_data(
    title: str = None,
    visibility: str = "private",
    tags: list = None
) -> Dict:
    """Create test recipe data."""
    return {
        "title": title or f"{fake.word()} {fake.word()} Recipe",
        "description": fake.text(max_nb_chars=200),
        "steps": [
            fake.sentence() for _ in range(3)
        ],
        "ingredients": [
            {
                "name": fake.word(),
                "amount": str(fake.random_int(1, 10)),
                "unit": fake.random_element(["cups", "grams", "tbsp", "tsp"])
            }
            for _ in range(fake.random_int(3, 6))
        ],
        "tags": tags or [fake.word(), fake.word()],
        "visibility": visibility
    }


async def register_and_login(client, user_data: Dict = None) -> Dict:
    """Helper to register a user and get auth token."""
    if user_data is None:
        user_data = create_test_user_data()
    
    # Register
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_data["email"],
            "password": user_data["password"]
        }
    )
    assert login_response.status_code == 200
    
    token_data = login_response.json()
    return {
        "user": response.json(),
        "access_token": token_data["access_token"],
        "headers": get_auth_headers(token_data["access_token"])
    }
