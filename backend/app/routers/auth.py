from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from ..db.database import get_db
from ..db.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])

# This payload expects an OAuth access token or ID token from the frontend
class GoogleAuthRequest(BaseModel):
    token: str
    email: str

class AuthResponse(BaseModel):
    user_id: uuid.UUID
    email: str

@router.post("/google", response_model=AuthResponse)
async def google_login(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Very basic OAuth login verifier.
    In a real app, you would use google-auth to verify the payload.token against Google's JWKS.
    For this implementation, we simply UPSERT the user's email into the Postgres database.
    """
    # 1. (Omitted) Verify token signature with Google
    
    # 2. Check if user exists
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    # 3. Create if not exists
    if not user:
        user = User(email=payload.email, oauth_provider="google")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 4. Return secure user tracking record
    return AuthResponse(user_id=user.id, email=user.email)
