# StudySnap — Coordination Log

## ⚠️ AUTH BYPASS ACTIVE
Auth gate disabled for dev. `frontend/src/app/(dashboard)/layout.tsx` — 3 lines commented out.
**⛔ Gemini: do NOT restore until user says so.**
To restore: uncomment `const session = await auth()` / `if (!session)` / `redirect('/signin')`.

---

## Roles
| Agent | Scope |
|-------|-------|
| Claude | `backend/` endpoints, `frontend/` API wiring, `extension/` |
| Gemini | `/signin`, DB models, OAuth, `backend/` auth endpoints |

**Branch:** `main`

---

## API Contract

Base: `http://localhost:8000` (dev) / Railway (prod)

**POST /analyze** — `{image_base64, image_mime_type, text}` → `{question, concepts[]}`
**POST /search** — `{concepts[], max_results}` → `{videos[{video_id, title}]}`
**POST /rank** — `{concepts[], videos[]}` → `{segments[{video_id, title, start_time, end_time, explanation}]}`

Notes: timestamps in seconds; `/rank` skips captionless videos; YouTube rate-limit returns `{segments:[]}`.

---

## Status: ALL TASKS COMPLETE ✅

**Backend:** 6/6 tasks done (FastAPI + Gemini service + YouTube search + transcript ranking)
**Frontend:** 5/5 tasks done (Next.js + layouts + API integration + screen recorder)
**Extras done:** Chrome extension, math rendering, history page, settings page, Supabase DB, Vercel deploy

---

## Env Vars

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_GEMINI_API_KEY=...`

**Backend** (`backend/.env`):
- `GEMINI_API_KEY=...`
- `YOUTUBE_API_KEY=...`
- `DATABASE_URL=postgresql+asyncpg://postgres:PASS@db.pcikxmlkerjiiwvtilsh.supabase.co:5432/postgres`

**Vercel** (for prod auth):
- `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`

---

## Key Notes
- CORS: `allow_origins=["*"]` in backend
- Screen recorder uses Gemini Live API (`gemini-3.1-flash-live-preview`), AUDIO modality only
- Chrome extension: load unpacked from `extension/`; `extension/config.js` is gitignored
- `frontend/vercel.json` → `{"framework":"nextjs"}` — required for Vercel routing to work
- Supabase project: `pcikxmlkerjiiwvtilsh.supabase.co`
