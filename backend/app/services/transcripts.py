from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound


def get_transcript(video_id: str) -> list[dict] | None:
    """Fetch transcript for a YouTube video. Returns None if unavailable."""
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        return transcript  # list of {"text": str, "start": float, "duration": float}
    except (TranscriptsDisabled, NoTranscriptFound, Exception):
        return None
