import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Use explicit path so .env loads correctly regardless of working directory
load_dotenv(Path(__file__).parent.parent / ".env")

from app.db.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="StudySnap API", lifespan=lifespan)

# Parse comma-separated origins; default to wildcard for local dev only.
_cors_raw = os.getenv("CORS_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _cors_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import analyze as analyze_router
app.include_router(analyze_router.router)

from app.routers import search as search_router
app.include_router(search_router.router)

from app.routers import rank as rank_router
app.include_router(rank_router.router)

from app.routers import auth as auth_router
app.include_router(auth_router.router)

from app.routers import history as history_router
app.include_router(history_router.router)

from app.routers import solve as solve_router
app.include_router(solve_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
