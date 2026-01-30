from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ..core.security import get_current_user
from ..core.config import get_settings
from ..core.logging import get_logger
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/tts", tags=["tts"])
logger = get_logger("api.tts")

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# ElevenLabs voice IDs - using Rachel (calm, clear voice)
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel


class TTSRequest(BaseModel):
    text: str
    voice_id: str = DEFAULT_VOICE_ID


@router.post("")
async def text_to_speech(
    request: TTSRequest,
    user_id: str = Depends(get_current_user)
):
    """Convert text to speech using ElevenLabs API."""
    logger.info(f"TTS request from user {user_id[:8]}... ({len(request.text)} chars)")

    settings = get_settings()

    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")

    # Strip markdown for cleaner speech
    clean_text = request.text
    clean_text = clean_text.replace("**", "").replace("*", "")
    clean_text = clean_text.replace("`", "")
    clean_text = clean_text.replace("#", "")
    clean_text = clean_text.replace("- ", ", ")

    # Limit text length to avoid excessive API usage
    if len(clean_text) > 5000:
        clean_text = clean_text[:5000] + "..."

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ELEVENLABS_API_URL}/{request.voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": clean_text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                },
                timeout=60.0
            )

            if response.status_code != 200:
                logger.error(f"ElevenLabs API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ElevenLabs API error: {response.text}"
                )

            logger.info(f"TTS generated successfully for user {user_id[:8]}...")

            return StreamingResponse(
                iter([response.content]),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3"
                }
            )

    except httpx.TimeoutException:
        logger.error("ElevenLabs API timeout")
        raise HTTPException(status_code=504, detail="TTS service timeout")
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
