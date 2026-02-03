from fastapi import APIRouter, Depends, UploadFile, File
from services.ai_service import AIService, get_ai_service
from domain.agent import ChatRequest, ChatResponse, IngredientsRequest, ConsultRequest
from api.deps import get_current_active_user
from domain.user import UserInDB
from core.ratelimit import limiter
from fastapi import Request

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_with_agent(
    chat_data: ChatRequest,
    request: Request,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Send a message to the AI culinary assistant.
    """
    response_text = await ai_service.get_chat_completion(chat_data.message)
    return ChatResponse(response=response_text)

@router.post("/consult", response_model=ChatResponse)
@limiter.limit("15/minute")
async def consult_with_agent(
    consult_data: ConsultRequest,
    request: Request,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Start or continue a culinary consultation with the AI.
    """
    messages = [m.model_dump() for m in consult_data.messages]
    response_text = await ai_service.get_consultation_completion(messages)
    return ChatResponse(response=response_text)

@router.post("/generate-from-ingredients", response_model=ChatResponse)
@limiter.limit("5/minute")
async def generate_from_ingredients(
    ing_data: IngredientsRequest,
    request: Request,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Generate a recipe based on a list of ingredients.
    """
    response_text = await ai_service.generate_recipe_from_ingredients(ing_data.ingredients)
    return ChatResponse(response=response_text)

@router.post("/analyze-video/{recipe_id}")
@limiter.limit("3/minute")
async def analyze_video_recipe(
    recipe_id: str,
    chat_data: ChatRequest,
    request: Request,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Analyze a video and update an existing recipe with the details.
    """
    success = await ai_service.analyze_video_and_update_recipe(recipe_id, chat_data.message)
    if not success:
        return {"status": "error", "message": "Failed to update recipe from AI analysis"}
    return {"status": "success", "message": "Recipe updated successfully"}

@router.post("/analyze-fridge")
@limiter.limit("3/minute")
async def analyze_fridge(
    request: Request,
    file: UploadFile = File(...),
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Analyze a photo of a fridge/ingredients.
    CURRENTLY SKELETON ONLY: Returns success if file is received.
    """
    if not file:
        return {"status": "error", "message": "No file uploaded"}
    
    # Logic to process image will go here
    
    return {"status": "success", "message": "Image received"}
