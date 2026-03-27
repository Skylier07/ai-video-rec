from unittest.mock import patch


def test_search_endpoint(client):
    mock_videos = [
        {"video_id": "abc123", "title": "Introduction to Algebra"},
        {"video_id": "def456", "title": "Solving Linear Equations"},
    ]
    with patch("app.routers.search.search_videos") as mock_fn:
        mock_fn.return_value = mock_videos
        response = client.post("/search", json={"concepts": ["algebra", "linear equations"]})

    assert response.status_code == 200
    data = response.json()
    assert len(data["videos"]) == 2
    assert data["videos"][0]["video_id"] == "abc123"
