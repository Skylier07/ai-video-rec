# Screen Recorder — Build Progress

## ✅ Task 1: Dependencies + env var
- Installed `@google/genai` npm package into `frontend/`
- Added `NEXT_PUBLIC_GEMINI_API_KEY=` placeholder to `frontend/.env.local`
- **Action needed:** Fill in your Gemini API key in `frontend/.env.local`

## ✅ Task 2: `ScreenRecorder.tsx` created
**File:** `frontend/src/components/ScreenRecorder.tsx`
- `getDisplayMedia` screen capture
- Canvas frame extraction every 5s → JPEG base64
- Gemini Live API (`gemini-2.0-flash-live-001`) via `@google/genai` JS SDK
- System instruction: detect homework problems, reply `PROBLEM_DETECTED: [question]` or `NO_PROBLEM`
- Floating button: blue 🔴 (idle) → pulsing red ■ (recording)
- Toast bottom-right: gold "PROBLEM DETECTED" label + question text + "Find Videos →" + "Dismiss"
- "Find Videos" saves frame to `localStorage["studysnap_input"]` → navigates to `/processing`
- Shift+S keyboard shortcut for immediate manual scan
- Toast auto-dismisses after 10s

## ✅ Task 3: Mounted in layout
**File:** `frontend/src/app/layout.tsx`
- Added `import ScreenRecorder from '@/components/ScreenRecorder';`
- Added `<ScreenRecorder />` after `<BottomNavBar />`

## ⬜ Task 4: Post-merge migration (do after merging Gemini's auth branch)
- Move `<ScreenRecorder />` mount from `app/layout.tsx` → `app/(dashboard)/layout.tsx`
  so it only shows for authenticated users

## ⬜ Task 5: Update CLAUDE.md + push
- Log completion in CLAUDE.md change log
- `git push`

---

## To test locally
1. Set `NEXT_PUBLIC_GEMINI_API_KEY=<your key>` in `frontend/.env.local`
2. `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Click the blue 🔴 button (bottom-left) → select a screen/window to share
5. Button turns red with pulse animation
6. Display a homework problem on the shared screen — within 5s a toast should appear
7. Click "Find Videos →" → recording stops → navigates to /processing → results appear
