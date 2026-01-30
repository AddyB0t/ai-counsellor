from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import get_supabase

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify token using Supabase and return user ID."""
    token = credentials.credentials

    try:
        supabase = get_supabase()
        # Use Supabase to verify the token
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
