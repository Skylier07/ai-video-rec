from youtube_transcript_api import YouTubeTranscriptApi


_api = YouTubeTranscriptApi()


def get_transcript(video_id: str) -> list[dict] | None:
    """Fetch transcript for a YouTube video. Returns None if unavailable."""
    try:
        transcript = _api.fetch(video_id, languages=["en"])
        return transcript.to_raw_data()  # list of {"text": str, "start": float, "duration": float}
    except Exception:
        return None
