from fastapi import APIRouter, Depends, HTTPException
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.logging import get_logger
from ..schemas import OnboardingData

router = APIRouter(prefix="/api/profile", tags=["profile"])
logger = get_logger("api.profile")


@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Get user profile and user_profile data."""
    logger.info(f"Fetching profile for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Get profile
        profile_result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        # Get user_profile
        user_profile_result = supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()

        logger.info(f"Profile retrieved for user {user_id[:8]}...")
        return {
            "profile": profile_result.data,
            "user_profile": user_profile_result.data
        }
    except Exception as e:
        logger.error(f"Error fetching profile for user {user_id[:8]}...: {str(e)}")
        raise


@router.put("")
async def update_profile(data: OnboardingData, user_id: str = Depends(get_current_user)):
    """Update user profile."""
    logger.info(f"Updating profile for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Update user_profiles
        update_data = data.model_dump(exclude_none=True)

        result = supabase.table("user_profiles").update(update_data).eq("user_id", user_id).execute()

        if not result.data:
            logger.warning(f"Profile not found for user {user_id[:8]}...")
            raise HTTPException(status_code=404, detail="Profile not found")

        logger.info(f"Profile updated for user {user_id[:8]}...")
        return {"message": "Profile updated", "data": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for user {user_id[:8]}...: {str(e)}")
        raise


@router.post("/onboarding")
async def save_onboarding(data: OnboardingData, user_id: str = Depends(get_current_user)):
    """Save onboarding data and mark onboarding as completed."""
    logger.info(f"Saving onboarding data for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Prepare data
        profile_data = {
            "user_id": user_id,
            **data.model_dump(exclude_none=True)
        }

        # Upsert user_profile
        supabase.table("user_profiles").upsert(profile_data, on_conflict="user_id").execute()

        # Mark onboarding as completed and advance to stage 2
        supabase.table("profiles").update({
            "onboarding_completed": True,
            "current_stage": 2
        }).eq("id", user_id).execute()

        logger.info(f"Onboarding completed for user {user_id[:8]}...")
        return {"message": "Onboarding completed"}
    except Exception as e:
        logger.error(f"Error saving onboarding for user {user_id[:8]}...: {str(e)}")
        raise
