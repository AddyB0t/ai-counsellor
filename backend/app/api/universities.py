from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.guards import guard_shortlist, guard_lock
from ..core.logging import get_logger
from ..schemas import ShortlistRequest

router = APIRouter(prefix="/api/universities", tags=["universities"])
logger = get_logger("api.universities")


@router.get("")
async def get_universities(
    country: Optional[str] = None,
    max_tuition: Optional[int] = None,
    program: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """Get all universities with optional filters."""
    logger.info(f"Fetching universities - filters: country={country}, max_tuition={max_tuition}")

    try:
        supabase = get_supabase()

        query = supabase.table("universities").select("*")

        if country:
            query = query.eq("country", country)

        if max_tuition:
            query = query.lte("tuition_max", max_tuition)

        result = query.order("ranking", desc=False).execute()

        logger.info(f"Retrieved {len(result.data)} universities")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching universities: {str(e)}")
        raise


@router.get("/shortlist")
async def get_shortlist(user_id: str = Depends(get_current_user)):
    """Get user's shortlisted universities."""
    logger.info(f"Fetching shortlist for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("shortlisted_universities").select(
            "*, university:universities(*)"
        ).eq("user_id", user_id).execute()

        logger.info(f"Retrieved {len(result.data)} shortlisted universities for user {user_id[:8]}...")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching shortlist for user {user_id[:8]}...: {str(e)}")
        raise


@router.post("/shortlist")
async def add_to_shortlist(data: ShortlistRequest, user_id: str = Depends(get_current_user)):
    """Add a university to shortlist."""
    logger.info(f"Adding university {data.university_id} to shortlist for user {user_id[:8]}...")

    try:
        # Apply guard
        guard_shortlist(user_id, data.university_id)

        supabase = get_supabase()

        # Check if already shortlisted
        existing = supabase.table("shortlisted_universities").select("*").eq(
            "user_id", user_id
        ).eq("university_id", data.university_id).execute()

        if existing.data:
            # Update category
            result = supabase.table("shortlisted_universities").update({
                "category": data.category,
                "ai_reasoning": data.reasoning
            }).eq("id", existing.data[0]["id"]).execute()
            logger.info(f"Updated shortlist category for university {data.university_id}")
        else:
            # Insert new
            result = supabase.table("shortlisted_universities").insert({
                "user_id": user_id,
                "university_id": data.university_id,
                "category": data.category,
                "ai_reasoning": data.reasoning
            }).execute()
            logger.info(f"Added university {data.university_id} to shortlist")

        return {"message": "Added to shortlist", "data": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to shortlist: {str(e)}")
        raise


@router.delete("/shortlist/{university_id}")
async def remove_from_shortlist(university_id: str, user_id: str = Depends(get_current_user)):
    """Remove a university from shortlist."""
    logger.info(f"Removing university {university_id} from shortlist for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Check if locked
        existing = supabase.table("shortlisted_universities").select("*").eq(
            "user_id", user_id
        ).eq("university_id", university_id).single().execute()

        if existing.data and existing.data.get("is_locked"):
            logger.warning(f"Attempted to remove locked university {university_id}")
            raise HTTPException(status_code=403, detail="Cannot remove locked university")

        supabase.table("shortlisted_universities").delete().eq(
            "user_id", user_id
        ).eq("university_id", university_id).execute()

        logger.info(f"Removed university {university_id} from shortlist")
        return {"message": "Removed from shortlist"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing from shortlist: {str(e)}")
        raise


@router.post("/lock/{university_id}")
async def lock_university(university_id: str, user_id: str = Depends(get_current_user)):
    """Lock a shortlisted university for application."""
    logger.info(f"Locking university {university_id} for user {user_id[:8]}...")

    try:
        # Apply guard
        guard_lock(user_id, university_id)

        supabase = get_supabase()

        result = supabase.table("shortlisted_universities").update({
            "is_locked": True
        }).eq("user_id", user_id).eq("university_id", university_id).execute()

        if not result.data:
            logger.warning(f"University {university_id} not in shortlist")
            raise HTTPException(status_code=404, detail="University not in shortlist")

        logger.info(f"University {university_id} locked successfully")
        return {"message": "University locked", "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error locking university: {str(e)}")
        raise


@router.post("/unlock/{university_id}")
async def unlock_university(university_id: str, user_id: str = Depends(get_current_user)):
    """Unlock a locked university."""
    logger.info(f"Unlocking university {university_id} for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("shortlisted_universities").update({
            "is_locked": False
        }).eq("user_id", user_id).eq("university_id", university_id).execute()

        if not result.data:
            logger.warning(f"University {university_id} not in shortlist")
            raise HTTPException(status_code=404, detail="University not in shortlist")

        logger.info(f"University {university_id} unlocked successfully")
        return {"message": "University unlocked", "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unlocking university: {str(e)}")
        raise
