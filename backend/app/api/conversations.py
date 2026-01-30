from fastapi import APIRouter, Depends, HTTPException
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.logging import get_logger
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
logger = get_logger("api.conversations")


class ConversationCreate(BaseModel):
    title: Optional[str] = "New conversation"


class ConversationUpdate(BaseModel):
    title: str


@router.get("")
async def get_conversations(user_id: str = Depends(get_current_user)):
    """Get all conversations for user, ordered by last message."""
    logger.info(f"Fetching conversations for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("conversations").select("*").eq(
            "user_id", user_id
        ).order("last_message_at", desc=True).execute()

        logger.info(f"Retrieved {len(result.data)} conversations")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise


@router.post("")
async def create_conversation(
    data: ConversationCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a new conversation."""
    logger.info(f"Creating conversation for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("conversations").insert({
            "user_id": user_id,
            "title": data.title
        }).execute()

        logger.info(f"Conversation created: {result.data[0]['id'] if result.data else 'unknown'}")
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get a specific conversation."""
    logger.info(f"Fetching conversation {conversation_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("conversations").select("*").eq(
            "id", conversation_id
        ).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        raise


@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get all messages for a conversation."""
    logger.info(f"Fetching messages for conversation {conversation_id[:8]}...")

    try:
        supabase = get_supabase()

        # Verify ownership
        conv = supabase.table("conversations").select("id").eq(
            "id", conversation_id
        ).eq("user_id", user_id).single().execute()

        if not conv.data:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = supabase.table("chat_messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("created_at", desc=False).execute()

        logger.info(f"Retrieved {len(messages.data)} messages")
        return messages.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise


@router.put("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    data: ConversationUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update conversation title."""
    logger.info(f"Updating conversation {conversation_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("conversations").update({
            "title": data.title
        }).eq("id", conversation_id).eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")

        logger.info(f"Conversation updated successfully")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {str(e)}")
        raise


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a conversation and all its messages."""
    logger.info(f"Deleting conversation {conversation_id[:8]}...")

    try:
        supabase = get_supabase()

        # Messages will be cascade deleted due to FK constraint
        supabase.table("conversations").delete().eq(
            "id", conversation_id
        ).eq("user_id", user_id).execute()

        logger.info(f"Conversation deleted successfully")
        return {"message": "Conversation deleted"}
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise
