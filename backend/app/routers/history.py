from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
import uuid
from typing import Any, List

from ..db.database import get_db
from ..db.models import History, User

router = APIRouter(prefix="/history", tags=["History"])

class SaveHistoryRequest(BaseModel):
    user_id: uuid.UUID
    question: str
    concepts: list[str]
    segments: list[dict]
    videos: list[dict]

class HistoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    extracted_question: str
    concepts: list[str]
    video_segments: dict
    created_at: Any

@router.post("")
async def save_history(payload: SaveHistoryRequest, db: AsyncSession = Depends(get_db)):
    """
    Saves a processed question into the user's history.
    """
    # Verify user exists
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    history_entry = History(
        user_id=payload.user_id,
        extracted_question=payload.question,
        concepts=payload.concepts,
        video_segments={
            "segments": payload.segments,
            "videos": payload.videos
        }
    )
    
    db.add(history_entry)
    await db.commit()
    await db.refresh(history_entry)
    
    return {"status": "success", "id": history_entry.id}

@router.get("/{user_id}", response_model=List[HistoryResponse])
async def get_history(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieves the question history for a specific user, sorted by newest first.
    """
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(History)
        .where(History.user_id == user_id)
        .order_by(desc(History.created_at))
    )
    history_entries = result.scalars().all()
    
    return history_entries
