from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini import solve_question

router = APIRouter()


class SolveRequest(BaseModel):
    question: str
    image_base64: str | None = None
    image_mime_type: str | None = None
    mode: str = "accurate"  # "accurate" = Pro, "fast" = Flash


class SolveStep(BaseModel):
    step_number: int
    title: str
    content: str


class SolveResponse(BaseModel):
    steps: list[SolveStep]
    final_answer: str


@router.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest):
    result = solve_question(
        question=req.question,
        image_base64=req.image_base64,
        image_mime_type=req.image_mime_type,
        mode=req.mode,
    )
    return result
