import pytest
from services.scraping_service import ScrapingService
import respx
import httpx

@pytest.fixture
def scraping_service():
    return ScrapingService()

@pytest.mark.asyncio
async def test_scrape_url_success(scraping_service):
    url = "https://example.com/recipe"
    mock_html = """
    <html>
        <head><title>Delicious Recipe</title></head>
        <body>
            <div class="recipe-content">
                <h1>Delicious Pasta</h1>
                <p>Ingredients: Pasta, Tomato, Basil</p>
            </div>
        </body>
    </html>
    """
    
    async with respx.mock:
        respx.get(url).mock(return_value=httpx.Response(200, text=mock_html))
        
        result = await scraping_service.scrape_url(url)
        
        assert result["url"] == url
        assert result["title"] == "Delicious Recipe"
        assert "Delicious Pasta" in result["content"]
        assert "Ingredients: Pasta, Tomato, Basil" in result["content"]

@pytest.mark.asyncio
async def test_scrape_url_http_error(scraping_service):
    url = "https://example.com/not-found"
    
    async with respx.mock:
        respx.get(url).mock(return_value=httpx.Response(404))
        
        with pytest.raises(Exception) as excinfo:
            await scraping_service.scrape_url(url)
        
        assert "Failed to fetch page: 404" in str(excinfo.value)

def test_extract_main_text_with_specific_class(scraping_service):
    from bs4 import BeautifulSoup
    html = """
    <html>
        <body>
            <div class="other">Not relevant</div>
            <div class="recipe-container">
                <p>This is the recipe.</p>
            </div>
        </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    text = scraping_service._extract_main_text(soup)
    assert "This is the recipe." in text
    # Note: Our current extractor looks for 'recipe' in class name

def test_extract_main_text_fallback(scraping_service):
    from bs4 import BeautifulSoup
    html = """
    <html>
        <body>
            <p>Just some body text.</p>
        </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    text = scraping_service._extract_main_text(soup)
    assert "Just some body text." in text
