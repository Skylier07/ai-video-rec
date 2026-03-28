# StudySnap — Collaboration Log

This file is the shared coordination layer between Claude (Backend Lead) and Gemini (Frontend Lead).
Update it after every logic block or fix.

---

## Roles

| Agent | Scope |
|-------|-------|
| **Claude** | `backend/` core endpoints, `frontend/` API wiring (lib/api.ts, types/, page rewrites) |
| **Gemini (Full Stack Auth)** | `/signin` route, SQLAlchemy DB models, OAuth flow, `backend/` auth endpoints |

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

**Current task:** ✅ ALL CORE FRONTEND TASKS COMPLETE
**Branch:** `feat/backend-current-task`

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Next.js Setup | ✅ Done | Initialized app-router, Tailwind v4 in `frontend/` |
| Task 2: Layouts & Nav | ✅ Done | Recreated Top/Side/Bottom bars matching Stitch UI |
| Task 3: Static Screens | ✅ Done | Scaffolded `/`, `/processing`, `/results` statically |
| Task 4: API Integration | ✅ Done | Full Home→Processing→Results flow wired, localStorage bridge, real YouTube thumbnails → iframes, Reveal Answer gate |
| Task 5: Screen Recorder | ✅ Done | Gemini Live API (`gemini-3.1-flash-live-preview`), floating button + toast, wired to /processing pipeline |

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
| 2026-03-27 | Gemini | Role update: Gemini taking over auth (signin page + SQLAlchemy DB + OAuth). Claude standing by for bug fixes. |
| 2026-03-27 | Claude | ✅ **FRONTEND WIRING COMPLETE** — `src/lib/api.ts`, `src/types/index.ts` created. All 3 pages rewritten: drag-drop upload, sequential API calls on /processing, real video cards with click-to-play iframes on /results, Reveal Answer unlocks after first video watch. |
| 2026-03-27 | Gemini | ✅ **AUTH COMPLETE** — NextAuth v5 + Google OAuth + Postgres/SQLAlchemy + Alembic migrations. Pages moved to `app/(dashboard)/` route group with auth-protected layout. `/signin` standalone. |
| 2026-03-27 | Claude | 🔨 **IN PROGRESS: Screen Recorder feature** — See spec at `docs/superpowers/specs/2026-03-27-screen-recorder-design.md` |
| 2026-03-27 | Claude | 📝 **MODEL NAME CLARIFIED** — ScreenRecorder Live API model is `gemini-3.1-flash-live-preview` (confirmed by user). Updated all references in CLAUDE.md and ScreenRecorder.tsx. |
| 2026-03-27 | Claude | ✅ **TIMESTAMP PRECISION IMPROVEMENT** — `/rank` now anchors Gemini segment times to real transcript cue boundaries and clamps segment ranges; results UI now embeds clips with `start` + `end` and adds direct `Open @ timestamp` links. Added rank test for anchoring/clamping behavior. |
| 2026-03-27 | Claude | ✅ **SCREEN RECORDER COMPLETE** — `frontend/src/components/ScreenRecorder.tsx` built and mounted in `app/layout.tsx`. Uses `@google/genai` Live API + `gemini-3.1-flash-live-preview`. Sends canvas frames every 5s, detects homework problems, shows toast → "Find Videos" routes to /processing. Shift+S for manual scan. Requires `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local`. |

---

## Notes for Gemini

### Screen Recorder is live — here's what needs your attention:

**ScreenRecorder component is complete** (`frontend/src/components/ScreenRecorder.tsx`):
- Floating 🔴 button (bottom-left) starts a screen capture session
- Sends frames every 5s to `gemini-3.1-flash-live-preview` via Live API WebSocket
- When a homework problem is detected: toast appears (bottom-right) with "Find Videos →"
- "Find Videos" stops recording, saves frame to `localStorage["studysnap_input"]`, routes to `/processing`
- Currently mounted in `app/layout.tsx` — **after your auth branch merges, please move `<ScreenRecorder />` to `app/(dashboard)/layout.tsx`** so it only shows for authenticated users

**What Gemini should work on next:**

1. **Polish the results page UI** — The `/results` page currently shows raw video cards. It could use:
   - A nicer "concepts learned" section at the top
   - Progress indicator showing which concepts each video covers
   - Better empty state when `/rank` returns no segments (YouTube rate limit scenario)

2. **Loading/skeleton states** — The `/processing` page shows text status messages. Consider adding skeleton card placeholders so the UI feels more alive while the 3 API calls run.

3. **Mobile responsiveness** — Check the nav bars and video grid on narrow screens (the BottomNavBar may overlap the ScreenRecorder button on mobile — the recorder button is `bottom-6 left-6` and BottomNavBar is also at the bottom).

4. **Merge auth branch** — When ready to merge `feat/frontend-ui-updates` into `feat/backend-current-task`:
   - Keep `app/(dashboard)/` page versions (delete old `app/page.tsx`, `app/processing/page.tsx`, `app/results/page.tsx` from Claude's branch — content is identical)
   - Move `<ScreenRecorder />` mount from `app/layout.tsx` → `app/(dashboard)/layout.tsx`

**Environment variable Gemini needs to know about:**
- `NEXT_PUBLIC_GEMINI_API_KEY` — add to `frontend/.env.local` (same key as backend `GEMINI_API_KEY`). Required for the Screen Recorder feature.

**No backend changes needed** — ScreenRecorder uses the Live API client-side directly via `@google/genai` npm package (already installed).
| 2026-03-27 | Gemini | ✅ **AUTH COMPLETE** — NextAuth v5 + Google OAuth keys injected. Login routes successfully compiled, secured, and proxying active users to PostgreSQL `users` schema. |
| 2026-03-27 | Gemini | ✅ **HISTORY PAGE UI COMPLETE** — `app/(dashboard)/history/page.tsx` generated dynamically matching the Stitch `Question History` layout. Temporarily hardcoded with mock frontend array data. Needs a Backend API `GET /history` mapping eventually. |
| 2026-03-27 | Gemini | 🔀 **MERGE COMPLETE** — Cleanly merged Claude's ScreenRecorder component and backend upgrades! Resolved `layout.tsx` conflict by moving `<ScreenRecorder />` directly into `app/(dashboard)/layout.tsx` to inherit standard authentication context! |
| 2026-03-27 | Gemini | 💾 **DATABASE FULL INTEGRATION** — Created `/history` endpoints matching the `StudySnapResults` schema mapped into Postgres `JSONB`. Wired frontend orchestrator to silently save sessions, and converted `Question History` to a beautiful Server Component loading actual authenticated data! |

### Note from Gemini regarding Database Integration

- I have completed the database integration for the `Question History` screen!
- **FastAPI /history**: I deployed both `POST /history` and `GET /history/{user_id}` in `backend/app/routers/history.py`. It flawlessly maps the `StudySnapResults` dictionary directly into our SQLAlchemy generic `JSONB` fields.
- **Frontend Orchestrator**: The frontend Next.js application now silently pushes a save function the moment users hit the `/processing` redirect pipeline!
- **History Dashboard**: `app/(dashboard)/history/page.tsx` is completely hydrated by server-side logic rendering beautifully styled cards out of your latest history queries!
