from fastapi import APIRouter
from app.models import SearchRequest, SearchResponse, VideoMeta
from app.services.youtube import search_videos

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    videos = search_videos(request.concepts, request.max_results)
    return SearchResponse(
        videos=[VideoMeta(video_id=v["video_id"], title=v["title"]) for v in videos]
    )
