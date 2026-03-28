import asyncio
from fastapi import APIRouter
from app.models import RankRequest, RankResponse, VideoSegment
from app.services.transcripts import get_transcript
from app.services.gemini import rank_segments

router = APIRouter()


def _to_int(value: object, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(value))  # tolerate numeric strings like "30.0"
        except (TypeError, ValueError):
            return default


def _normalize_segment_times(
    transcript: list[dict],
    proposed_start: object,
    proposed_end: object,
) -> tuple[int, int]:
    """Anchor segment times to transcript cue boundaries and clamp range."""
    cue_starts: list[int] = []
    cue_ends: list[int] = []

    for cue in transcript:
        start_float = float(cue.get("start", 0) or 0)
        duration_float = float(cue.get("duration", 0) or 0)
        start = max(0, int(round(start_float)))
        end = max(start + 1, int(round(start_float + duration_float)))
        cue_starts.append(start)
        cue_ends.append(end)

    if not cue_starts:
        start = max(0, _to_int(proposed_start, 0))
        end = max(start + 1, _to_int(proposed_end, start + 60))
        return start, end

    model_start = max(0, _to_int(proposed_start, cue_starts[0]))
    model_end = _to_int(proposed_end, model_start + 60)

    prior_cues = [s for s in cue_starts if s <= model_start]
    anchored_start = prior_cues[-1] if prior_cues else cue_starts[0]

    max_transcript_end = max(cue_ends)
    min_end = anchored_start + 1
    clamped_end = min(max_transcript_end, max(model_end, min_end))

    return anchored_start, clamped_end


async def _process_video(video, concepts: list[str]) -> list[VideoSegment]:
    """Fetch transcript and rank segments for a single video — runs concurrently."""
    transcript = await asyncio.to_thread(get_transcript, video.video_id)
    if not transcript:
        return []

    segments = await asyncio.to_thread(
        rank_segments,
        concepts=concepts,
        video_id=video.video_id,
        title=video.title,
        transcript=transcript,
    )

    result = []
    for seg in segments:
        start_time, end_time = _normalize_segment_times(
            transcript=transcript,
            proposed_start=seg.get("start_time"),
            proposed_end=seg.get("end_time"),
        )
        result.append(VideoSegment(
            video_id=str(seg.get("video_id", video.video_id)),
            title=str(seg.get("title", video.title)),
            start_time=start_time,
            end_time=end_time,
            explanation=str(seg.get("explanation", "")),
        ))
    return result


@router.post("/rank", response_model=RankResponse)
async def rank(request: RankRequest):
    results_per_video = await asyncio.gather(
        *[_process_video(video, request.concepts) for video in request.videos]
    )
    all_segments = [seg for segs in results_per_video for seg in segs]
    return RankResponse(segments=all_segments[:3])
