from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
import httpx
import uuid
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.guards import guard_shortlist, guard_lock
from ..core.logging import get_logger
from ..schemas import ShortlistRequest, ExternalShortlistRequest

router = APIRouter(prefix="/api/universities", tags=["universities"])
logger = get_logger("api.universities")

# External API for searching universities worldwide
HIPO_API_URL = "http://universities.hipolabs.com/search"


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


@router.get("/search-external")
async def search_external_universities(
    name: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    user_id: str = Depends(get_current_user)
):
    """Search universities from external Hipo API (large global dataset)."""
    logger.info(f"Searching external universities - name={name}, country={country}")

    if not name and not country:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least a name or country to search"
        )

    try:
        params = {}
        if name:
            params["name"] = name
        if country:
            params["country"] = country
        params["limit"] = limit

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(HIPO_API_URL, params=params)
            response.raise_for_status()
            universities = response.json()

        # Transform to consistent format
        results = []
        for uni in universities[:limit]:
            results.append({
                "id": None,  # External universities don't have DB ID
                "name": uni.get("name"),
                "country": uni.get("country"),
                "alpha_two_code": uni.get("alpha_two_code"),
                "website": uni.get("web_pages", [None])[0],
                "domains": uni.get("domains", []),
                "state_province": uni.get("state-province"),
                "is_external": True,  # Flag to indicate this is from external API
            })

        logger.info(f"Found {len(results)} external universities")
        return results

    except httpx.TimeoutException:
        logger.error("External API timeout")
        raise HTTPException(status_code=504, detail="External university search timed out")
    except httpx.HTTPError as e:
        logger.error(f"External API error: {str(e)}")
        raise HTTPException(status_code=502, detail="External university search failed")
    except Exception as e:
        logger.error(f"Error searching external universities: {str(e)}")
        raise


@router.post("/shortlist-external")
async def shortlist_external_university(
    data: ExternalShortlistRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Shortlist an external university.
    This creates the university in our DB first (if not exists), then shortlists it.
    """
    logger.info(f"Shortlisting external university: {data.name} for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Check if this external university already exists in our DB
        existing_uni = supabase.table("universities").select("*").eq(
            "name", data.name
        ).eq("country", data.country).execute()

        if existing_uni.data:
            university_id = existing_uni.data[0]["id"]
            logger.info(f"External university already exists in DB: {university_id}")
        else:
            # Create the external university in our DB
            new_uni = supabase.table("universities").insert({
                "name": data.name,
                "country": data.country,
                "website": data.website,
                "is_external": True,  # Flag to distinguish from curated ones
                "ranking": None,
                "tuition_min": None,
                "tuition_max": None,
                "acceptance_rate": None,
            }).execute()

            if not new_uni.data:
                raise HTTPException(status_code=500, detail="Failed to create university")

            university_id = new_uni.data[0]["id"]
            logger.info(f"Created external university in DB: {university_id}")

        # Now shortlist it
        existing_shortlist = supabase.table("shortlisted_universities").select("*").eq(
            "user_id", user_id
        ).eq("university_id", university_id).execute()

        if existing_shortlist.data:
            # Update category
            result = supabase.table("shortlisted_universities").update({
                "category": data.category,
                "ai_reasoning": data.reasoning
            }).eq("id", existing_shortlist.data[0]["id"]).execute()
            logger.info(f"Updated shortlist for external university {university_id}")
        else:
            # Insert new shortlist
            result = supabase.table("shortlisted_universities").insert({
                "user_id": user_id,
                "university_id": university_id,
                "category": data.category,
                "ai_reasoning": data.reasoning
            }).execute()
            logger.info(f"Added external university {university_id} to shortlist")

        # Return with full university data
        final_result = supabase.table("shortlisted_universities").select(
            "*, university:universities(*)"
        ).eq("user_id", user_id).eq("university_id", university_id).single().execute()

        return {"message": "External university added to shortlist", "data": final_result.data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error shortlisting external university: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
