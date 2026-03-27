import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StudySnap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import analyze as analyze_router
app.include_router(analyze_router.router)

from app.routers import search as search_router
app.include_router(search_router.router)

from app.routers import rank as rank_router
app.include_router(rank_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
