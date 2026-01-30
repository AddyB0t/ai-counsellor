"""
Decision Authority Boundary Guards
Backend enforces all rules. AI cannot bypass guards.
"""
from fastapi import HTTPException
from .database import get_supabase


def guard_shortlist(user_id: str, university_id: str):
    """Guard for shortlisting a university."""
    supabase = get_supabase()

    # Check if user has completed onboarding
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    user = result.data

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("onboarding_completed"):
        raise HTTPException(status_code=403, detail="Complete onboarding first")

    if user.get("current_stage", 1) < 2:
        raise HTTPException(status_code=403, detail="Not in discovery stage yet")


def guard_lock(user_id: str, university_id: str):
    """Guard for locking a university."""
    supabase = get_supabase()

    # Check user stage
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    user = result.data

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("current_stage", 1) < 2:
        raise HTTPException(status_code=403, detail="Not eligible to lock yet")

    # Check if university is shortlisted
    shortlist = supabase.table("shortlisted_universities").select("*").eq("user_id", user_id).eq("university_id", university_id).execute()

    if not shortlist.data:
        raise HTTPException(status_code=403, detail="Must shortlist before locking")


def guard_create_task(user_id: str, university_id: str = None):
    """Guard for creating tasks."""
    if not university_id:
        return  # General tasks allowed

    supabase = get_supabase()

    # Check if university is locked
    locked = supabase.table("shortlisted_universities").select("*").eq("user_id", user_id).eq("university_id", university_id).eq("is_locked", True).execute()

    if not locked.data:
        raise HTTPException(status_code=403, detail="Lock university before creating application tasks")
