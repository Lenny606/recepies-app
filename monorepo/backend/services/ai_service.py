import json
import re
import base64
import numpy as np
import cv2
import yt_dlp
from openai import OpenAI
from core.config import get_settings
from domain.recipe import RecipeUpdate, Ingredient
from repository.recipe_repository import RecipeRepository
from datetime import datetime
from typing import List, Union, Dict, Any, Optional
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
video_upload_url = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + os.getenv("GEMINI_API_KEY")
class AIService:
    def __init__(self, recipe_repo: RecipeRepository = None):
        # Gemini API via OpenAI compatibility layer
        self.client = OpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        self.model = settings.GEMINI_MODEL_NAME
        self.recipe_repo = recipe_repo

    def _extract_frames(self, video_url: str, num_frames: int = 15) -> List[str]:
        """
        Extracts frames from a video URL using yt-dlp and OpenCV.
        Returns a list of base64 encoded JPEG strings.
        """
        try:
            ydl_opts = {
                'format': 'best[height<=480]', # Low res is enough for AI and faster to process
                'noplaylist': True,
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                stream_url = info['url']
                
            cap = cv2.VideoCapture(stream_url)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames <= 0:
                cap.release()
                return []
                
            # Sample frames evenly across the video
            indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
            frames_b64 = []
            
            for idx in indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    continue
                
                # Optional: Resize to further reduce payload if needed
                # frame = cv2.resize(frame, (640, 360))
                
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                b64 = base64.b64encode(buffer).decode('utf-8')
                frames_b64.append(b64)
                
            cap.release()
            return frames_b64
        except Exception as e:
            print(f"Error extracting frames: {e}")
            return []

    async def get_chat_completion(self, message: str, frames: List[str] = None) -> str:
        """
        Enhanced chat completion that can handle text and/or a sequence of video frames.
        """
        if not settings.GEMINI_API_KEY:
            return "AI feature is not configured. Please add GEMINI_API_KEY to .env"

        content = [{"type": "text", "text": message}]
        
        if frames:
            for frame_b64 in frames:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{frame_b64}"}
                })

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful culinary assistant. Analyze the provided text and/or video frames to extract recipe details. Return only a JSON object with fields: title, ingredients, instructions, tags, image_url. TRANSLATE ALL FIELDS INTO CZECH (čeština)"
                    },
                    {"role": "user", "content": content},
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"

    async def analyze_recipe_text(self, text_content: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes recipe text content and returns structured JSON.
        """
        if not settings.GEMINI_API_KEY:
            raise Exception("AI feature is not configured. Please add GEMINI_API_KEY to .env")

        prompt = f"""
        Analyze the following text content extracted from a webpage and identify if it contains a recipe.
        If it does, extract the recipe details into a structured JSON format.
        
        {f'Original URL: {url}' if url else ''}
        
        Text Content:
        {text_content[:8000]}  # Limit content to avoid token issues
        
        Return ONLY a JSON object with the following structure:
        {{
          "title": "Recipe Name",
          "description": "Short description of the recipe",
          "ingredients": [
            {{"name": "ingredient name", "amount": "quantity", "unit": "unit or null"}}
          ],
          "steps": ["Step 1", "Step 2", ...],
          "tags": ["tag1", "tag2", ...],
          "image_url": "URL to the recipe image if found",
          "web_url": "{url if url else ''}"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a professional chef and recipe data extractor. TRANSLATE ALL CONTENT INTO CZECH (čeština). Return only valid JSON."
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={ "type": "json_object" } if "gemini" not in self.model.lower() else None
            )
            
            ai_response = response.choices[0].message.content
            
            # Basic parsing if not using json_object mode
            json_match = re.search(r"```json\n(.*?)\n```", ai_response, re.DOTALL)
            json_str = json_match.group(1) if json_match else ai_response
            
            return json.loads(json_str)
        except Exception as e:
            print(f"Error analyzing recipe text: {e}")
            raise Exception(f"AI Analysis failed: {str(e)}")

    async def analyze_video_and_update_recipe(self, recipe_id: str, video_url: str) -> bool:
        """
        Analyzes a video by extracting frames and then updates the recipe in the DB.
        """
        if not self.recipe_repo:
            return False

        # 1. Extract frames (Binary data representation)
        print(f"Extracting frames from {video_url}...")
        frames = self._extract_frames(video_url)
        
        prompt = f"Analyze this video from URL: {video_url}. Extract the recipe details based on the visual content and title."
        
        # 2. Get AI analysis
        ai_response = await self.get_chat_completion(prompt, frames=frames)
        
        # 3. Parse and save
        json_match = re.search(r"```json\n(.*?)\n```", ai_response, re.DOTALL)
        json_str = json_match.group(1) if json_match else ai_response

        try:
            data = json.loads(json_str)
            ingredients = [Ingredient(name=ing, amount="", unit="") for ing in data.get("ingredients", [])]

            update_data = RecipeUpdate(
                title=data.get("title"),
                steps=data.get("instructions"),
                ingredients=ingredients,
                tags=data.get("tags"),
                image_url=data.get("image_url")
            )

            update_dict = update_data.model_dump(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            return await self.recipe_repo.update(recipe_id, update_dict)
        except Exception as e:
            print(f"Error updating recipe: {e}")
            return False

    async def generate_recipe_from_ingredients(self, ingredients: List[str]) -> str:
        """
        Generates a recipe based on a list of ingredients.
        """
        if not settings.GEMINI_API_KEY:
            return "AI feature is not configured. Please add GEMINI_API_KEY to .env"

        ingredients_str = ", ".join(ingredients)
        prompt = f"Navrhni chutný recept, který využívá tyto ingredience: {ingredients_str}. Můžeš přidat i základní suroviny (sůl, pepř, olej, voda atd.)."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "Jsi profesionální šéfkuchař a asistent. Na základě seznamu ingrediencí navrhneš recept. Odpověď formuluj jasně a strukturovaně v češtině. Recept musí obsahovat: Název, Seznam ingrediencí a Postup přípravy."
                    },
                    {"role": "user", "content": prompt},
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Chyba při komunikaci s AI: {str(e)}"

    async def get_consultation_completion(self, messages: List[Dict[str, str]]) -> str:
        """
        Generic chat completion for general culinary consultations.
        """
        if not settings.GEMINI_API_KEY:
            return "AI feature is not configured. Please add GEMINI_API_KEY to .env"

        # Security: Limit total context size (approximate)
        total_chars = sum(len(m.get("content", "")) for m in messages)
        if total_chars > 20000:  # Roughly 5k-10k tokens
            return "Kontext zprávy je příliš dlouhý. Prosím, začněte znovu."

        try:
            # Enforce allowed roles for LLM safety
            allowed_roles = {"user", "assistant"}
            safe_messages = [
                {"role": m["role"], "content": m["content"]}
                for m in messages if m.get("role") in allowed_roles
            ]

            full_messages = [
                {
                    "role": "system",
                    "content": "Jsi kulinářský expert. Odpovídej stručně, věcně a bez zbytečných okolků. Soustřeď se na fakta, techniky a konkrétní rady. Pokud je to vhodné, používej odrážky. Komunikuj v češtině."
                }
            ] + safe_messages

            response = self.client.chat.completions.create(
                model=self.model,
                messages=full_messages
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Chyba při komunikaci s AI: {str(e)}"

# Dependency
from core.database import get_database
async def get_ai_service():
    db = await get_database()
    repo = RecipeRepository(db)
    return AIService(recipe_repo=repo)
