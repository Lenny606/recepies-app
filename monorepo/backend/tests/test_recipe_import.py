import pytest
from unittest.mock import AsyncMock, MagicMock
from services.recipe_service import RecipeService
from domain.recipe import RecipeResponse, Visibility, Ingredient

@pytest.fixture
def mock_recipe_repo():
    return AsyncMock()

@pytest.fixture
def mock_scraping_service():
    service = MagicMock()
    service.scrape_url = AsyncMock()
    return service

@pytest.fixture
def mock_ai_service():
    service = MagicMock()
    service.analyze_recipe_text = AsyncMock()
    return service

@pytest.fixture
def recipe_service(mock_recipe_repo, mock_scraping_service, mock_ai_service):
    return RecipeService(mock_recipe_repo, mock_scraping_service, mock_ai_service)

@pytest.mark.asyncio
async def test_create_recipe_from_url_success(recipe_service, mock_scraping_service, mock_ai_service, mock_recipe_repo):
    url = "https://example.com/pasta"
    author_id = "user123"
    
    # Mock Scraping
    mock_scraping_service.scrape_url.return_value = {
        "content": "Make pasta with tomato and basil."
    }
    
    # Mock AI Analysis
    mock_ai_service.analyze_recipe_text.return_value = {
        "title": "Tomato Pasta",
        "description": "Simple pasta",
        "ingredients": [
            {"name": "Pasta", "amount": "200", "unit": "g"},
            {"name": "Tomato", "amount": "2", "unit": "pcs"}
        ],
        "steps": ["Boil pasta", "Add tomato"],
        "tags": ["pasta", "easy"]
    }
    
    # Mock Repo Create
    mock_recipe_repo.create.return_value = MagicMock(
        model_dump=lambda by_alias=False: {
            "_id": "recipe123",
            "title": "Tomato Pasta",
            "author_id": author_id,
            "ingredients": [
                {"name": "Pasta", "amount": "200", "unit": "g"},
                {"name": "Tomato", "amount": "2", "unit": "pcs"}
            ],
            "steps": ["Boil pasta", "Add tomato"],
            "tags": ["pasta", "easy"],
            "visibility": "public",
            "web_url": url,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }
    )
    
    result = await recipe_service.create_recipe_from_url(url, author_id)
    
    assert result.title == "Tomato Pasta"
    assert len(result.ingredients) == 2
    assert result.web_url == url
    assert mock_scraping_service.scrape_url.called
    assert mock_ai_service.analyze_recipe_text.called
    assert mock_recipe_repo.create.called

@pytest.mark.asyncio
async def test_create_recipe_with_should_scrape_flag(recipe_service, mock_scraping_service, mock_ai_service, mock_recipe_repo):
    from domain.recipe import RecipeCreate
    url = "https://example.com/pasta"
    author_id = "user123"
    
    recipe_in = RecipeCreate(
        title="", # Title can be empty when scraping
        web_url=url,
        should_scrape=True
    )
    
    # Mock Scraping and AI
    mock_scraping_service.scrape_url.return_value = {"content": "..."}
    mock_ai_service.analyze_recipe_text.return_value = {
        "title": "Tomato Pasta",
        "ingredients": [],
        "steps": [],
        "tags": []
    }
    
    # Mock Repo
    mock_recipe_repo.create.return_value = MagicMock(
        model_dump=lambda by_alias=False: {
            "_id": "recipe123",
            "title": "Tomato Pasta",
            "author_id": author_id,
            "ingredients": [],
            "steps": [],
            "tags": [],
            "visibility": "public",
            "web_url": url,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }
    )
    
    result = await recipe_service.create_recipe(recipe_in, author_id)
    
    assert result.title == "Tomato Pasta"
    assert mock_scraping_service.scrape_url.called
    assert mock_ai_service.analyze_recipe_text.called

@pytest.mark.asyncio
async def test_create_recipe_from_url_scraping_failure(recipe_service, mock_scraping_service):
    url = "https://invalid-url.com"
    mock_scraping_service.scrape_url.side_effect = Exception("Scraping failed")
    
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as excinfo:
        await recipe_service.create_recipe_from_url(url, "user123")
    
    assert excinfo.value.status_code == 400
    assert "Failed to scrape URL" in excinfo.value.detail
