import os

from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


def search_videos(concepts: list[str], max_results: int = 5) -> list[dict]:
    """Search YouTube for educational videos covering the given concepts."""
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    query = " ".join(concepts) + " tutorial explanation"

    response = youtube.search().list(
        q=query,
        part="id,snippet",
        type="video",
        maxResults=max_results,
        relevanceLanguage="en",
        videoCaption="closedCaption",
    ).execute()

    return [
        {
            "video_id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
        }
        for item in response.get("items", [])
    ]
