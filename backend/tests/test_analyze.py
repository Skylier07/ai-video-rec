def test_app_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


import json
from unittest.mock import patch, MagicMock
from app.services.gemini import analyze_question


def test_analyze_question_with_text():
    mock_response = MagicMock()
    mock_response.text = '{"question": "What is 2+2?", "concepts": ["addition", "arithmetic"]}'

    with patch("app.services.gemini.model_analyze") as mock_model:
        mock_model.generate_content.return_value = mock_response
        result = analyze_question(image_base64=None, image_mime_type=None, text="What is 2+2?")

    assert result["question"] == "What is 2+2?"
    assert "addition" in result["concepts"]


def test_rank_segments_returns_list():
    mock_response = MagicMock()
    mock_response.text = '[{"video_id": "abc", "title": "Math", "start_time": 10, "end_time": 60, "explanation": "Covers addition basics."}]'

    transcript = [{"text": "Let us learn addition", "start": 10.0, "duration": 5.0}]

    with patch("app.services.gemini.model_rank") as mock_model:
        mock_model.generate_content.return_value = mock_response
        from app.services.gemini import rank_segments
        result = rank_segments(
            concepts=["addition"],
            video_id="abc",
            title="Math",
            transcript=transcript,
        )

    assert isinstance(result, list)
    assert result[0]["video_id"] == "abc"
    assert result[0]["start_time"] == 10
