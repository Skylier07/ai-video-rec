from fastapi import APIRouter, HTTPException
from app.models import AnalyzeRequest, AnalyzeResponse
from app.services.gemini import analyze_question

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    if not request.image_base64 and not request.text:
        raise HTTPException(status_code=422, detail="Provide image_base64 or text")

    result = analyze_question(
        image_base64=request.image_base64,
        image_mime_type=request.image_mime_type,
        text=request.text,
    )
    return AnalyzeResponse(
        question=result["question"],
        concepts=result["concepts"],
    )
