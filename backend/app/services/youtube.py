import math
import os
from concurrent.futures import ThreadPoolExecutor

from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


def search_videos(concepts: list[str], max_results: int = 5) -> list[dict]:
    """Search YouTube for each concept in parallel, returning results in concept order.

    Fires one search per concept concurrently so concept[0]'s videos come first
    (preserving ordering by question relevance) while cutting total search time
    from N×latency to ~1×latency.
    """
    if not concepts:
        return []

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    per_concept = max(1, math.ceil(max_results / len(concepts)))

    def search_one(concept: str) -> list[dict]:
        response = youtube.search().list(
            q=f"{concept} tutorial explanation",
            part="id,snippet",
            type="video",
            maxResults=per_concept,
            relevanceLanguage="en",
            videoCaption="closedCaption",
        ).execute()
        return [
            {"video_id": item["id"]["videoId"], "title": item["snippet"]["title"]}
            for item in response.get("items", [])
        ]

    with ThreadPoolExecutor(max_workers=len(concepts)) as executor:
        concept_results = list(executor.map(search_one, concepts))

    seen_ids: set[str] = set()
    results: list[dict] = []
    for videos in concept_results:
        for video in videos:
            if video["video_id"] not in seen_ids:
                seen_ids.add(video["video_id"])
                results.append(video)

    return results
