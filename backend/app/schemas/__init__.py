from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class OnboardingData(BaseModel):
    education_level: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = 4.0
    intended_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake: Optional[str] = None
    preferred_countries: Optional[List[str]] = None
    budget_min: Optional[int] = 10000
    budget_max: Optional[int] = 50000
    funding_type: Optional[str] = None
    english_test_type: Optional[str] = None
    english_test_status: Optional[str] = None
    english_test_score: Optional[float] = None
    aptitude_test_type: Optional[str] = None
    aptitude_test_status: Optional[str] = None
    aptitude_test_score: Optional[int] = None
    sop_status: Optional[str] = "Not started"


class ShortlistRequest(BaseModel):
    university_id: str
    category: str
    reasoning: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    university_id: Optional[str] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    actions: Optional[List[dict]] = None
