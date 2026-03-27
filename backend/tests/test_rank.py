from unittest.mock import patch

MOCK_TRANSCRIPT = [
    {"text": "Welcome to this algebra lesson", "start": 0.0, "duration": 3.0},
    {"text": "Today we learn how to solve linear equations", "start": 3.0, "duration": 4.0},
    {"text": "For example, 2x equals 4, so x equals 2", "start": 30.0, "duration": 5.0},
]

MOCK_SEGMENTS = [
    {
        "video_id": "abc123",
        "title": "Intro to Algebra",
        "start_time": 30,
        "end_time": 90,
        "explanation": "This segment demonstrates solving a basic linear equation step by step.",
    }
]


def test_rank_endpoint(client):
    with patch("app.routers.rank.get_transcript") as mock_transcript, \
         patch("app.routers.rank.rank_segments") as mock_rank:
        mock_transcript.return_value = MOCK_TRANSCRIPT
        mock_rank.return_value = MOCK_SEGMENTS
        response = client.post("/rank", json={
            "concepts": ["algebra"],
            "videos": [{"video_id": "abc123", "title": "Intro to Algebra"}],
        })

    assert response.status_code == 200
    data = response.json()
    assert len(data["segments"]) >= 1
    assert data["segments"][0]["video_id"] == "abc123"
    assert data["segments"][0]["start_time"] == 30


def test_rank_skips_videos_without_transcripts(client):
    with patch("app.routers.rank.get_transcript") as mock_transcript, \
         patch("app.routers.rank.rank_segments") as mock_rank:
        mock_transcript.return_value = None
        mock_rank.return_value = []
        response = client.post("/rank", json={
            "concepts": ["algebra"],
            "videos": [{"video_id": "noCaptions", "title": "No Captions Video"}],
        })

    assert response.status_code == 200
    assert response.json()["segments"] == []
