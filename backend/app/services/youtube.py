import math
import os

from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


def search_videos(concepts: list[str], max_results: int = 5) -> list[dict]:
    """Search YouTube for educational videos covering the given concepts.

    Searches each concept separately and returns results in concept order so
    that downstream ranking preserves the order concepts appear in the question.
    """
    if not concepts:
        return []

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    per_concept = max(1, math.ceil(max_results / len(concepts)))

    seen_ids: set[str] = set()
    results: list[dict] = []

    for concept in concepts:
        query = f"{concept} tutorial explanation"
        response = youtube.search().list(
            q=query,
            part="id,snippet",
            type="video",
            maxResults=per_concept,
            relevanceLanguage="en",
            videoCaption="closedCaption",
        ).execute()

        for item in response.get("items", []):
            vid_id = item["id"]["videoId"]
            if vid_id not in seen_ids:
                seen_ids.add(vid_id)
                results.append({
                    "video_id": vid_id,
                    "title": item["snippet"]["title"],
                })

    return results
