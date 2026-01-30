from fastapi import APIRouter, Depends, HTTPException
from ..core.security import get_current_user
from ..core.database import get_supabase
from ..core.guards import guard_create_task
from ..core.logging import get_logger
from ..schemas import TaskCreate, TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
logger = get_logger("api.tasks")


@router.get("")
async def get_tasks(user_id: str = Depends(get_current_user)):
    """Get all tasks for user."""
    logger.info(f"Fetching tasks for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        result = supabase.table("tasks").select(
            "*, university:universities(name, country)"
        ).eq("user_id", user_id).order("due_date", desc=False).execute()

        logger.info(f"Retrieved {len(result.data)} tasks for user {user_id[:8]}...")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise


@router.get("/by-university")
async def get_tasks_by_university(user_id: str = Depends(get_current_user)):
    """Get tasks grouped by locked university for dashboard display."""
    logger.info(f"Fetching tasks by university for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Get locked universities
        locked = supabase.table("shortlisted_universities").select(
            "university_id, category, university:universities(id, name, country, ranking)"
        ).eq("user_id", user_id).eq("is_locked", True).execute()

        # Get all tasks for user
        tasks = supabase.table("tasks").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()

        # Group tasks by university
        result = []
        for item in locked.data:
            uni_id = item["university_id"]
            uni_tasks = [t for t in tasks.data if t.get("university_id") == uni_id]
            completed = len([t for t in uni_tasks if t.get("is_completed", False)])

            result.append({
                "university": item["university"],
                "category": item["category"],
                "tasks": uni_tasks,
                "completed_count": completed,
                "total_count": len(uni_tasks)
            })

        logger.info(f"Retrieved tasks for {len(result)} locked universities")
        return result
    except Exception as e:
        logger.error(f"Error fetching tasks by university: {str(e)}")
        raise


@router.post("")
async def create_task(data: TaskCreate, user_id: str = Depends(get_current_user)):
    """Create a new task."""
    logger.info(f"Creating task '{data.title}' for user {user_id[:8]}...")

    try:
        # Apply guard
        guard_create_task(user_id, data.university_id)

        supabase = get_supabase()

        task_data = {
            "user_id": user_id,
            "title": data.title,
            "description": data.description,
            "category": data.category,
            "university_id": data.university_id,
            "due_date": data.due_date.isoformat() if data.due_date else None
        }

        result = supabase.table("tasks").insert(task_data).execute()

        logger.info(f"Task created: {result.data[0]['id'] if result.data else 'unknown'}")
        return {"message": "Task created", "data": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise


@router.put("/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, user_id: str = Depends(get_current_user)):
    """Update a task."""
    logger.info(f"Updating task {task_id} for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Verify ownership
        existing = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).single().execute()

        if not existing.data:
            logger.warning(f"Task {task_id} not found for user {user_id[:8]}...")
            raise HTTPException(status_code=404, detail="Task not found")

        update_data = data.model_dump(exclude_none=True)
        if "due_date" in update_data and update_data["due_date"]:
            update_data["due_date"] = update_data["due_date"].isoformat()

        result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()

        logger.info(f"Task {task_id} updated successfully")
        return {"message": "Task updated", "data": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise


@router.delete("/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    """Delete a task."""
    logger.info(f"Deleting task {task_id} for user {user_id[:8]}...")

    try:
        supabase = get_supabase()

        # Verify ownership
        existing = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).single().execute()

        if not existing.data:
            logger.warning(f"Task {task_id} not found for user {user_id[:8]}...")
            raise HTTPException(status_code=404, detail="Task not found")

        supabase.table("tasks").delete().eq("id", task_id).execute()

        logger.info(f"Task {task_id} deleted successfully")
        return {"message": "Task deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        raise
