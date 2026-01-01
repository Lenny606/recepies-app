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
            "User-Agent": "curl/7.68.0",
            "Accept": "*/*"
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
        main_content = self._extract_main_text(soup)
        
        # Extraction of main image URL
        main_image = self._extract_main_image(soup)

        return {
            "url": url,
            "title": title,
            "content": main_content,
            "image_url": main_image,
            "raw_html": html_content if len(html_content) < 50000 else "Content too large"
        }

    def _extract_main_image(self, soup: BeautifulSoup) -> Optional[str]:
        """
        Tries to extract the main image URL from the page.
        """
        # 1. Look for OpenGraph image
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image.get("content")

        # 2. Look for Twitter card image
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            return twitter_image.get("content")

        # 3. Look for schema.org image
        import json
        json_ld = soup.find_all("script", type="application/ld+json")
        for ld in json_ld:
            try:
                data = json.loads(ld.string)
                if isinstance(data, dict):
                    if data.get("@type") == "Recipe" and data.get("image"):
                        img = data.get("image")
                        if isinstance(img, list): return img[0]
                        if isinstance(img, dict): return img.get("url")
                        return img
            except:
                continue

        # 4. Fallback: first large-ish image in the content area
        # This is a bit risky but better than nothing
        for img in soup.find_all("img"):
            src = img.get("src")
            if src and (src.startswith("http") or src.startswith("//")):
                # Basic filter for non-icon images
                alt = img.get("alt", "")
                if len(alt) > 5:
                    return src

        return None

    def _extract_main_text(self, soup: BeautifulSoup) -> str:
        """
        Extracts the main text content from the soup object.
        """
        # Common recipe site selectors
        recipe_selectors = [
            '.recipe-content', '.recipe-container', '.recipe-body',
            '.wprm-recipe-container', '.tasty-recipes',
            'article', 'main', '.post-content', '.entry-content'
        ]
        
        extracted_parts = []
        
        # Try specific selectors first
        for selector in recipe_selectors:
            elements = soup.select(selector)
            for element in elements:
                extracted_parts.append(element.get_text(separator=' ', strip=True))
        
        if not extracted_parts:
            # Fallback: get all text from body
            if soup.body:
                extracted_parts.append(soup.body.get_text(separator=' ', strip=True))
        
        # Join and clean
        full_text = " ".join(extracted_parts)
        
        # Basic cleaning of extra whitespace
        return " ".join(full_text.split())
