from fastapi import APIRouter
from app.models import RankRequest, RankResponse, VideoSegment
from app.services.transcripts import get_transcript
from app.services.gemini import rank_segments

router = APIRouter()


@router.post("/rank", response_model=RankResponse)
def rank(request: RankRequest):
    all_segments: list[VideoSegment] = []

    for video in request.videos:
        transcript = get_transcript(video.video_id)
        if not transcript:
            continue

        segments = rank_segments(
            concepts=request.concepts,
            video_id=video.video_id,
            title=video.title,
            transcript=transcript,
        )

        for seg in segments:
            all_segments.append(VideoSegment(
                video_id=seg["video_id"],
                title=seg["title"],
                start_time=int(seg["start_time"]),
                end_time=int(seg["end_time"]),
                explanation=seg["explanation"],
            ))

    return RankResponse(segments=all_segments[:3])
