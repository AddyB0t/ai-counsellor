from fastapi import APIRouter, Depends, HTTPException
from ..core.security import get_current_user
from ..core.logging import get_logger
from ..services.ai_counsellor import AICounsellor
from ..schemas import ChatRequest, ChatResponse
import httpx
import openai

router = APIRouter(prefix="/api/counsellor", tags=["counsellor"])
logger = get_logger("api.counsellor")


class AIServiceError(Exception):
    """Custom exception for AI service errors."""
    pass


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    """Chat with the AI counsellor."""
    logger.info(f"Chat request from user {user_id[:8]}...")

    try:
        counsellor = AICounsellor()
        result = counsellor.chat(user_id, request.message, request.conversation_id)

        logger.info(f"Chat response generated for user {user_id[:8]}...")
        return ChatResponse(
            response=result["response"],
            actions=result.get("actions")
        )

    except httpx.ConnectError as e:
        logger.error(f"Connection error to AI service: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "service_unavailable",
                "message": "AI service is currently starting up. Please wait a moment and try again.",
                "retry_after": 30
            }
        )

    except httpx.TimeoutException as e:
        logger.error(f"Timeout connecting to AI service: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail={
                "error": "gateway_timeout",
                "message": "AI service is taking too long to respond. Please try again.",
                "retry_after": 15
            }
        )

    except openai.RateLimitError as e:
        logger.warning(f"Rate limit exceeded: {str(e)}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit",
                "message": "Too many requests. Please wait a moment before trying again.",
                "retry_after": 60
            }
        )

    except openai.AuthenticationError as e:
        logger.error(f"AI service authentication error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "configuration_error",
                "message": "AI service configuration error. Please contact support."
            }
        )

    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail={
                "error": "ai_service_error",
                "message": "AI service encountered an error. Please try again.",
                "retry_after": 10
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred. Please try again."
            }
        )
