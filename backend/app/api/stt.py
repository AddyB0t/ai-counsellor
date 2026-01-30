from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..core.security import get_current_user
from ..core.config import get_settings
from ..core.logging import get_logger
import httpx
import io

router = APIRouter(prefix="/api/stt", tags=["stt"])
logger = get_logger("api.stt")

OPENAI_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions"


@router.post("")
async def speech_to_text(
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Convert speech to text using OpenAI Whisper API."""
    logger.info(f"STT request from user {user_id[:8]}... (file: {audio.filename})")

    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    # Read audio file
    audio_content = await audio.read()

    # Limit file size (25MB is OpenAI's limit)
    if len(audio_content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")

    logger.info(f"Audio file size: {len(audio_content)} bytes")

    try:
        async with httpx.AsyncClient() as client:
            # Prepare multipart form data
            files = {
                "file": (audio.filename or "audio.webm", audio_content, audio.content_type or "audio/webm"),
                "model": (None, "whisper-1"),
            }

            response = await client.post(
                OPENAI_WHISPER_URL,
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                },
                files=files,
                timeout=60.0
            )

            if response.status_code != 200:
                logger.error(f"OpenAI Whisper API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenAI Whisper API error: {response.text}"
                )

            result = response.json()
            transcribed_text = result.get("text", "")

            logger.info(f"STT successful for user {user_id[:8]}... ({len(transcribed_text)} chars)")

            return {"text": transcribed_text}

    except httpx.TimeoutException:
        logger.error("OpenAI Whisper API timeout")
        raise HTTPException(status_code=504, detail="STT service timeout")
    except Exception as e:
        logger.error(f"STT error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")
