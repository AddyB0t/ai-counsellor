from fastapi import APIRouter, Depends, HTTPException
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.config import get_settings
from ..core.logging import get_logger
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/sop", tags=["sop"])
logger = get_logger("api.sop")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

SOP_GENERATION_PROMPT = """You are an expert admissions consultant helping a student write their Statement of Purpose (SOP) for graduate school applications.

## Student Profile:
{user_profile}

## Target University: {university_name}
## Target Program: {program}

## Guidelines for Writing the SOP:
1. Write in first person with an authentic, personal voice
2. Be specific about academic journey, achievements, and experiences
3. Connect past experiences to future career goals
4. Show genuine interest in the specific university and program
5. Keep it between 500-800 words (approximately 1-2 pages)
6. Avoid clichés and generic statements
7. Be honest and reflective

## Structure to Follow:
1. **Opening Hook** (1 paragraph): Start with a compelling story, moment, or insight that sparked your interest in the field
2. **Academic Background** (1-2 paragraphs): Discuss your academic journey, relevant coursework, GPA context, and intellectual development
3. **Research/Work Experience** (1-2 paragraphs): Highlight relevant projects, internships, or work experience
4. **Why This Program** (1 paragraph): Explain specific reasons for choosing this university and program (faculty, research, resources)
5. **Future Goals** (1 paragraph): Describe your career aspirations and how this program helps achieve them
6. **Conclusion** (1 paragraph): Reinforce your fit and enthusiasm

Generate a compelling, personalized Statement of Purpose:"""


class SOPRequest(BaseModel):
    university_id: Optional[str] = None
    custom_prompt: Optional[str] = None


class SOPUpdate(BaseModel):
    content: str
    title: Optional[str] = None
    is_draft: Optional[bool] = None


@router.get("")
async def get_sops(user_id: str = Depends(get_current_user)):
    """Get all SOPs for user."""
    logger.info(f"Fetching SOPs for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("sop_documents").select(
            "*, university:universities(name, country)"
        ).eq("user_id", user_id).order("updated_at", desc=True).execute()

        logger.info(f"Retrieved {len(result.data)} SOPs")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching SOPs: {str(e)}")
        raise


@router.get("/{sop_id}")
async def get_sop(sop_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific SOP."""
    logger.info(f"Fetching SOP {sop_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("sop_documents").select(
            "*, university:universities(name, country)"
        ).eq("id", sop_id).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="SOP not found")

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching SOP: {str(e)}")
        raise


@router.post("/generate")
async def generate_sop(
    data: SOPRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate SOP using AI."""
    logger.info(f"Generating SOP for user {user_id[:8]}...")

    try:
        supabase = get_supabase()
        settings = get_settings()

        # Get user profile
        profile = supabase.table("user_profiles").select("*").eq(
            "user_id", user_id
        ).single().execute()

        if not profile.data:
            raise HTTPException(status_code=400, detail="Complete your profile first")

        up = profile.data
        preferred_countries = up.get('preferred_countries') or []

        user_profile_str = f"""
- Education Level: {up.get('education_level', 'Not specified')}
- Current Degree: {up.get('degree', 'Not specified')}
- GPA: {up.get('gpa', 'N/A')}/{up.get('gpa_scale', 4.0)}
- Target Degree: {up.get('intended_degree', 'Not specified')}
- Field of Study: {up.get('field_of_study', 'Not specified')}
- Target Intake: {up.get('target_intake', 'Not specified')}
- Countries of Interest: {', '.join(preferred_countries) if preferred_countries else 'Not specified'}
- English Test: {up.get('english_test_type', 'Not taken')} - Score: {up.get('english_test_score', 'N/A')}
- Aptitude Test: {up.get('aptitude_test_type', 'Not taken')} - Score: {up.get('aptitude_test_score', 'N/A')}
"""

        # Get university info if specified
        university_name = "your target university"
        program = up.get('field_of_study', 'your chosen program')

        if data.university_id:
            uni = supabase.table("universities").select("name, programs").eq(
                "id", data.university_id
            ).single().execute()
            if uni.data:
                university_name = uni.data.get("name", university_name)

        # Generate SOP using GPT-4o via OpenRouter
        client = OpenAI(api_key=settings.openrouter_api_key, base_url=OPENROUTER_BASE_URL)

        prompt = SOP_GENERATION_PROMPT.format(
            user_profile=user_profile_str,
            university_name=university_name,
            program=program
        )

        if data.custom_prompt:
            prompt += f"\n\n## Additional Instructions from Student:\n{data.custom_prompt}"

        logger.info(f"Calling OpenRouter API for SOP generation...")

        response = client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert admissions consultant who writes compelling, personalized Statements of Purpose for graduate school applicants."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        sop_content = response.choices[0].message.content

        # Save to database
        result = supabase.table("sop_documents").insert({
            "user_id": user_id,
            "university_id": data.university_id,
            "title": f"SOP for {university_name}",
            "content": sop_content,
            "is_draft": True
        }).execute()

        logger.info(f"SOP generated and saved successfully")
        return result.data[0] if result.data else {"content": sop_content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating SOP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate SOP: {str(e)}")


@router.put("/{sop_id}")
async def update_sop(
    sop_id: str,
    data: SOPUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update SOP content."""
    logger.info(f"Updating SOP {sop_id[:8]}...")

    try:
        supabase = get_supabase()

        update_data = {"content": data.content}
        if data.title is not None:
            update_data["title"] = data.title
        if data.is_draft is not None:
            update_data["is_draft"] = data.is_draft

        result = supabase.table("sop_documents").update(update_data).eq(
            "id", sop_id
        ).eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="SOP not found")

        logger.info(f"SOP updated successfully")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating SOP: {str(e)}")
        raise


@router.delete("/{sop_id}")
async def delete_sop(sop_id: str, user_id: str = Depends(get_current_user)):
    """Delete an SOP."""
    logger.info(f"Deleting SOP {sop_id[:8]}...")

    try:
        supabase = get_supabase()

        supabase.table("sop_documents").delete().eq(
            "id", sop_id
        ).eq("user_id", user_id).execute()

        logger.info(f"SOP deleted successfully")
        return {"message": "SOP deleted"}
    except Exception as e:
        logger.error(f"Error deleting SOP: {str(e)}")
        raise
