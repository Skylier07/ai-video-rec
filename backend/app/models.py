from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None   # base64-encoded image bytes
    image_mime_type: Optional[str] = None  # e.g. "image/jpeg"
    text: Optional[str] = None
    mode: Optional[str] = "accurate"  # "accurate" = 3.1-pro, "fast" = 3.1-flash


class AnalyzeResponse(BaseModel):
    question: str
    concepts: list[str]  # 2-4 concepts


class VideoMeta(BaseModel):
    video_id: str
    title: str


class SearchRequest(BaseModel):
    concepts: list[str]
    max_results: int = 5


class SearchResponse(BaseModel):
    videos: list[VideoMeta]


class RankRequest(BaseModel):
    concepts: list[str]
    videos: list[VideoMeta]


class VideoSegment(BaseModel):
    video_id: str
    title: str
    start_time: int   # seconds
    end_time: int     # seconds
    explanation: str  # 1-2 sentences


class RankResponse(BaseModel):
    segments: list[VideoSegment]  # top 3 segments overall
