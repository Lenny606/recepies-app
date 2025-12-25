from fastapi import APIRouter, Depends
from services.ai_service import AIService, get_ai_service
from domain.agent import ChatRequest, ChatResponse
from api.deps import get_current_active_user
from domain.user import UserInDB

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Send a message to the AI culinary assistant.
    """
    response_text = await ai_service.get_chat_completion(request.message)
    return ChatResponse(response=response_text)

@router.post("/analyze-video/{recipe_id}")
async def analyze_video_recipe(
    recipe_id: str,
    video_url: str,
    ai_service: AIService = Depends(get_ai_service),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Analyze a video and update an existing recipe with the details.
    """
    success = await ai_service.analyze_video_and_update_recipe(recipe_id, video_url)
    if not success:
        return {"status": "error", "message": "Failed to update recipe from AI analysis"}
    return {"status": "success", "message": "Recipe updated successfully"}
