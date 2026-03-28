# Screen Recorder Feature — Design Spec

## Context

Students often encounter homework problems while browsing the web (Khan Academy, Google Classroom, PDFs in the browser, etc.). The current StudySnap flow requires them to manually screenshot and upload — friction that breaks their study flow. This feature adds a persistent screen monitor that watches the student's screen in the background and proactively offers to find explanation videos when a problem is detected, reducing the upload step to a single click.

---

## What We're Building

A floating "Record Screen" button (bottom-left, all pages) that starts a screen capture session using the browser's Screen Capture API. While recording, StudySnap periodically captures frames and sends them to the existing `/analyze` Gemini endpoint. When a homework problem is detected, a toast notification appears offering to find videos. Clicking "Find Videos" stops recording and routes the captured frame through the existing `/processing` pipeline.

**No backend changes required** — the feature reuses the existing `/analyze`, `/search`, and `/rank` endpoints exactly as the upload flow does.

---

## User Flow

```
[Idle]
  User clicks 🔴 button (bottom-left, all pages)
    → Browser shows screen share dialog (getDisplayMedia)
    → User selects what to share (screen / window / tab)

[Recording]
  Button turns red + pulsing, tooltip shows "● REC | Next check: 28s | ⇧S to scan now"
  Every 30 seconds: capture frame → POST /analyze
  Shift+S anytime: capture frame immediately → POST /analyze

  If /analyze returns a question:
    → Toast appears bottom-right: detected question + "Find Videos" + "Dismiss"
    → Toast auto-dismisses after 10 seconds if ignored
    → Recording continues while toast is visible

  If no question found: silently continue, reset 30s timer

[User clicks "Find Videos"]
  → Stop recording (stream.getTracks().forEach(t => t.stop()))
  → Save {imageBase64, imageMimeType: "image/jpeg", text: null} to localStorage["studysnap_input"]
  → router.push("/processing")
  → Normal /analyze → /search → /rank pipeline runs

[User clicks "Dismiss"]
  → Hide toast
  → Recording continues, 30s timer resets

[User clicks ■ stop button while recording]
  → Stop recording, return to idle state
```

---

## Architecture

### Component: `ScreenRecorder` (`frontend/src/components/ScreenRecorder.tsx`)

Single component added to `layout.tsx` so it persists across all page navigations (Next.js App Router layouts do not remount on navigation).

**State:**
- `isRecording: boolean` — whether capture is active
- `stream: MediaStream | null` — the active display media stream
- `countdown: number` — seconds until next auto-check (counts down from 30)
- `toast: { question: string; imageBase64: string } | null` — current detection result

**Refs:**
- `videoRef: HTMLVideoElement` — hidden video element that plays the stream (needed to capture frames via canvas)
- `intervalRef: NodeJS.Timeout` — the 30s polling interval
- `countdownRef: NodeJS.Timeout` — the 1s countdown ticker

**Key functions:**

```typescript
startRecording()
  → navigator.mediaDevices.getDisplayMedia({ video: true })
  → assign stream to videoRef.srcObject
  → start 30s interval + 1s countdown ticker
  → listen for stream.getVideoTracks()[0].onended (user stops from browser UI)

captureAndAnalyze()
  → draw videoRef frame to offscreen canvas (1280×720)
  → canvas.toDataURL("image/jpeg", 0.7) → strip prefix → base64
  → POST /analyze with image_base64
  → if response.question → setToast({ question, imageBase64 })
  → reset countdown to 30

stopRecording()
  → stream.getTracks().forEach(t => t.stop())
  → clear intervals
  → setIsRecording(false), setStream(null), setToast(null)

handleFindVideos()
  → stopRecording()
  → localStorage.setItem("studysnap_input", JSON.stringify({ imageBase64: toast.imageBase64, imageMimeType: "image/jpeg", text: null }))
  → router.push("/processing")
```

**Keyboard shortcut:** `useEffect` adds `keydown` listener for `Shift+S` while recording → calls `captureAndAnalyze()`.

**Hidden video element:** `<video ref={videoRef} autoPlay muted playsInline className="hidden" />` — lives in the component, never shown.

**Toast auto-dismiss:** `useEffect` on `toast` state — `setTimeout(dismissToast, 10000)`.

### Layout change (`frontend/src/app/layout.tsx`)

Add `<ScreenRecorder />` inside `<body>`, after `<BottomNavBar />`. It renders the floating button and toast overlay at the layout level.

---

## UI Details

**Idle button** (bottom-left, `fixed bottom-6 left-6 z-50`):
- 44×44px circle, `bg-primary` (blue `#00236f`)
- Red circle icon `●` or `🔴`
- Tooltip on hover: "Start Screen Monitor"

**Recording button** (same position):
- `bg-error` (red `#ba1a1a`) with pulsing ring animation (`animate-ping` on a sibling div)
- ■ stop icon
- Tooltip: `● REC | Next check: {countdown}s | ⇧S to scan now`

**Toast** (bottom-right, `fixed bottom-6 right-6 z-[70]`):
- Matches existing error toast style: `bg-primary text-on-primary rounded-2xl shadow-2xl`
- Gold dot + "PROBLEM DETECTED" label
- Extracted question text (truncated to 2 lines)
- "Find Videos →" (gold) + "Dismiss" (muted) buttons
- 10s auto-dismiss

---

## Reused Code

| Existing piece | Location | How reused |
|---|---|---|
| `analyzeQuestion()` | `frontend/src/lib/api.ts` | Called with frame base64 directly |
| `StudySnapInput` type | `frontend/src/types/index.ts` | Written to localStorage |
| Toast styling | `frontend/src/app/processing/page.tsx` | Same `bg-primary px-6 py-4 rounded-2xl` pattern |
| `loading-ring` CSS | `frontend/src/app/globals.css` | Reused for pulsing record indicator |

---

## Error Handling

- `getDisplayMedia()` rejected (user cancels dialog) → silently do nothing, stay idle
- `/analyze` throws during frame check → silently skip that check, continue recording
- `/analyze` returns no question (empty/different content on screen) → no toast, continue
- Stream ends externally (user clicks "Stop sharing" in browser) → `track.onended` fires → call `stopRecording()`

---

## Constraints & Known Limits

- `getDisplayMedia()` requires a user gesture — the button click satisfies this
- Only works over HTTPS or localhost (existing dev setup is fine; Railway/Vercel both use HTTPS)
- Frame analysis burns Gemini API quota: ~2 API calls/minute at max (1 auto + manual). Acceptable for demo.
- Canvas capture resolution capped at 1280×720 to keep base64 payload reasonable
- Recording **stops** when user clicks "Find Videos" (by design)

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/components/ScreenRecorder.tsx` | **Create** — full component |
| `frontend/src/app/layout.tsx` | **Modify** — add `<ScreenRecorder />` |

No backend changes. No new dependencies.
