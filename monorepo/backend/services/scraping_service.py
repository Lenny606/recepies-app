import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ScrapingService:
    """
    Service for scraping content from web pages.
    """

    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrapes the given URL and returns basic content like title and text.
        """
        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                return self._parse_html(response.text, url)
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred while scraping {url}: {e}")
            raise Exception(f"Failed to fetch page: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Unexpected error occurred while scraping {url}: {e}")
            raise Exception(f"An unexpected error occurred during scraping: {str(e)}")

    def _parse_html(self, html_content: str, url: str) -> Dict[str, Any]:
        """
        Parses HTML content using BeautifulSoup.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        title = soup.title.string.strip() if soup.title else ""
        
        # Basic extraction of main content
        # This can be improved with site-specific selectors or common patterns
        main_content = self._extract_main_text(soup)

        return {
            "url": url,
            "title": title,
            "content": main_content,
            "raw_html": html_content if len(html_content) < 50000 else "Content too large"
        }

    def _extract_main_text(self, soup: BeautifulSoup) -> str:
        """
        Extracts the main text content from the soup object.
        """
        # Simplistic approach: get text from body or article tags
        content_areas = soup.find_all(['article', 'main', 'div'], class_=lambda x: x and any(word in x.lower() for word in ['content', 'recipe', 'article', 'post']))
        
        if content_areas:
            # Join text from found content areas
            text = " ".join([area.get_text(separator=' ', strip=True) for area in content_areas])
        else:
            # Fallback to body text
            text = soup.body.get_text(separator=' ', strip=True) if soup.body else ""

        # Basic cleaning of extra whitespace
        return " ".join(text.split())
