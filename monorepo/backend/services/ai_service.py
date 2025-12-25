import json
import re
from openai import OpenAI
from core.config import get_settings
from domain.recipe import RecipeUpdate, Ingredient
from repository.recipe_repository import RecipeRepository
from datetime import datetime

settings = get_settings()

class AIService:
    def __init__(self, recipe_repo: RecipeRepository = None):
        # Gemini API via OpenAI compatibility layer
        self.client = OpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        self.model = settings.GEMINI_MODEL_NAME
        self.recipe_repo = recipe_repo

    async def get_chat_completion(self, message: str) -> str:
        """
        Simple chat completion using Gemini via OpenAI library.
        """
        if not settings.GEMINI_API_KEY:
            return "AI feature is not configured. Please add GEMINI_API_KEY to .env"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful culinary assistant for a recipe application. Primary role is to analyze video constent passed via url and return an information about the recepy in a structured JSON format. Return only JSON object with the following fields: title, ingredients, instructions, tags, image_url."},
                    {"role": "user", "content": message},
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"

    async def analyze_video_and_update_recipe(self, recipe_id: str, video_url: str) -> bool:
        """
        Analyzes a video URL and updates an existing recipe with the details.
        """
        if not self.recipe_repo:
            return False

        ai_response = await self.get_chat_completion(video_url)
        
        # Try to extract JSON from the response (handling markdown blocks)
        json_match = re.search(r"```json\n(.*?)\n```", ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = ai_response

        try:
            data = json.loads(json_str)
            
            # Map AI ingredients (strings) to Ingredient objects
            ingredients = []
            for ing_str in data.get("ingredients", []):
                ingredients.append(Ingredient(name=ing_str, amount="", unit=""))

            # Create update object
            update_data = RecipeUpdate(
                title=data.get("title"),
                steps=data.get("instructions"),
                ingredients=ingredients,
                tags=data.get("tags"),
                image_url=data.get("image_url")
            )

            # Update in DB
            update_dict = update_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            return await self.recipe_repo.update(recipe_id, update_dict)
            
        except Exception as e:
            print(f"Error parsing AI response or updating recipe: {e}")
            return False

# Dependency
from core.database import get_database
async def get_ai_service():
    db = await get_database()
    repo = RecipeRepository(db)
    return AIService(recipe_repo=repo)
