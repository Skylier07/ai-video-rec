# StudySnap — Collaboration Log

This file is the shared coordination layer between Claude (Backend Lead) and Gemini (Frontend Lead).
Update it after every logic block or fix.

---

## Roles

| Agent | Scope |
|-------|-------|
| **Claude (Backend Lead)** | `backend/`, root config files (`.gitignore`, `requirements.txt`, `.env.example`, `Procfile`) |
| **Gemini (Frontend Lead)** | `frontend/`, `frontend/lib/api.ts`, `frontend/types/` |

**Branch:** `feat/backend-current-task`

---

## API Contract (for Gemini to consume)

All endpoints live at `http://localhost:8000` (dev) / Railway URL (prod).

### POST /analyze
**Request:**
```json
{
  "image_base64": "<base64 string | null>",
  "image_mime_type": "<string | null>",
  "text": "<string | null>"
}
```
**Response:**
```json
{
  "question": "string",
  "concepts": ["string", "string"]
}
```

### POST /search
**Request:**
```json
{
  "concepts": ["string"],
  "max_results": 5
}
```
**Response:**
```json
{
  "videos": [
    { "video_id": "string", "title": "string" }
  ]
}
```

### POST /rank
**Request:**
```json
{
  "concepts": ["string"],
  "videos": [
    { "video_id": "string", "title": "string" }
  ]
}
```
**Response:**
```json
{
  "segments": [
    {
      "video_id": "string",
      "title": "string",
      "start_time": 30,
      "end_time": 90,
      "explanation": "string"
    }
  ]
}
```

---

## Backend Status

**Current task:** ✅ ALL BACKEND TASKS COMPLETE
**Branch:** `feat/backend-current-task`
**Overall progress:** 6 / 6 tasks complete

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Repo setup | ✅ Done | git init, .gitignore, README, requirements.txt |
| Task 2: FastAPI scaffold + models | ✅ Done | Health endpoint, all Pydantic models, TDD green |
| Task 3: Gemini service | ✅ Done | analyze_question (2.5-pro) + rank_segments (2.0-flash), 3 tests passing |
| Task 4: POST /analyze | ✅ Done | 5 tests passing, router registered |
| Task 5: YouTube search + POST /search | ✅ Done | 6 tests passing, YouTube API + /search route |
| Task 6: Transcript + POST /rank | ✅ Done | 8 tests passing, /rank endpoint live |

---

## Notes for Gemini

- CORS is set to `allow_origins=["*"]` during dev — no need to configure anything on the frontend
- All timestamps are in **seconds** (integers)
- If a video has no captions, it will be silently skipped — /rank may return fewer than 3 segments (handle gracefully in UI)
- `/rank` uses `youtube-transcript-api v1.2.4` — if YouTube rate-limits the IP, `/rank` returns `{"segments": []}`. Frontend should show a friendly fallback in this case.
- The `/analyze` endpoint requires at least one of `image_base64` or `text` — send `null` for the unused field
- Environment variable for frontend: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Frontend Status

**Current task:** Wiring up UI components
**Branch:** `feat/frontend-ui-updates`

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Next.js Setup | ✅ Done | Initialized app-router, Tailwind v4 in `frontend/` |
| Task 2: Layouts & Nav | ✅ Done | Recreated Top/Side/Bottom bars matching Stitch UI |
| Task 3: Static Screens | ✅ Done | Scaffolded `/`, `/processing`, `/results` statically |
| Task 4: API Integration | ⏳ Pending | Waiting for Backend endpoints to be fully ready |

---

## Change Log

| Date | Agent | Change |
|------|-------|--------|
| 2026-03-27 | Claude | Created CLAUDE.md, initialized Backend Lead role, starting Task 1 |
| 2026-03-27 | Claude | Task 1 complete ✅ — repo initialized, pushed to github.com/Skylier07/ai-video-rec on feat/backend-current-task |
| 2026-03-27 | Claude | Task 2 started — FastAPI scaffold + Pydantic models |
| 2026-03-27 | Gemini | Scaffolded Next.js frontend UI (`/`, `/processing`, `/results`) accurately matching Stitch design |
| 2026-03-27 | Claude | Merged `feat/frontend-ui-updates` into `feat/backend-current-task` — no conflicts, 6 backend tests still passing |
| 2026-03-27 | Claude | Task 5 complete ✅ — YouTube search service + /search endpoint |
| 2026-03-27 | Claude | Task 6 starting — transcript fetching + /rank endpoint. **Backend will be fully ready after Task 6.** |
| 2026-03-27 | Claude | 🎉 **ALL BACKEND TASKS COMPLETE** — 8/8 tests passing. `/analyze`, `/search`, `/rank` all live. Gemini can now wire up API integration (Task 4). |
| 2026-03-27 | Claude | fix: upgraded youtube-transcript-api 0.6.3→1.2.4 (new v1 API). `/rank` verified working. Note: YouTube may rate-limit transcript fetching after many requests — this clears on its own. |
