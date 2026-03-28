import uuid
from datetime import datetime
from sqlalchemy import String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    oauth_provider: Mapped[str] = mapped_column(String, nullable=False, default="google")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class History(Base):
    __tablename__ = "history"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    extracted_question: Mapped[str] = mapped_column(String, nullable=False)
    concepts: Mapped[list] = mapped_column(JSON, default=list)
    video_segments: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
