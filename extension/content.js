// StudySnap Extension — Content Script
// All monitoring logic lives here: button UI, toast, capture timer, Gemini WebSocket.
// Content scripts are persistent for the tab's lifetime — no service worker lifecycle issues.

(function () {
  if (document.getElementById("studysnap-root")) return;

  // ── State ─────────────────────────────────────────────────────────────────

  let isRecording = false;
  let ws = null;
  let captureInterval = null;
  let pendingText = "";
  let latestBase64 = null;
  let toastEl = null;
  let toastTimer = null;

  const SYSTEM_INSTRUCTION = `You are a homework problem detector. You receive frames from a student's screen.

Your ONLY job:
- If you can clearly see a homework question, math problem, or exam question being displayed, respond with EXACTLY:
  PROBLEM_DETECTED: [copy the question text here]
- If there is no clear homework problem visible, respond with EXACTLY:
  NO_PROBLEM
- Never add any other text, explanation, or commentary.`;

  const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
  const CAPTURE_INTERVAL_MS = 5000;

  // ── Root container ────────────────────────────────────────────────────────

  const root = document.createElement("div");
  root.id = "studysnap-root";
  document.body.appendChild(root);

  // ── Floating button ───────────────────────────────────────────────────────

  const btn = document.createElement("button");
  btn.id = "studysnap-btn";
  btn.title = "Start StudySnap screen monitor";
  btn.textContent = "🔴";
  root.appendChild(btn);

  const ring = document.createElement("div");
  ring.id = "studysnap-ring";
  ring.style.display = "none";
  root.appendChild(ring);

  btn.addEventListener("click", () => {
    if (isRecording) stopMonitoring(); else startMonitoring();
  });

  // ── Start / Stop ──────────────────────────────────────────────────────────

  function startMonitoring() {
    isRecording = true;
    btn.textContent = "■";
    btn.title = "Stop StudySnap screen monitor";
    ring.style.display = "block";
    openWebSocket();
  }

  function stopMonitoring() {
    isRecording = false;
    btn.textContent = "🔴";
    btn.title = "Start StudySnap screen monitor";
    ring.style.display = "none";
    dismissToast();
    cleanup();
  }

  // ── Gemini Live API WebSocket ─────────────────────────────────────────────

  function openWebSocket() {
    if (ws) ws.close();
    pendingText = "";

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[StudySnap] WS connected");
      ws.send(JSON.stringify({
        setup: {
          model: "models/gemini-3.1-flash-live-preview",
          generationConfig: { responseModalities: ["AUDIO"] },
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
            role: "user",
          },
        },
      }));

      captureInterval = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
      setTimeout(captureAndSend, 800);
    };

    ws.onmessage = async (event) => {
      let text;
      if (event.data instanceof Blob) {
        text = await event.data.text();
      } else {
        text = event.data;
      }

      let msg;
      try { msg = JSON.parse(text); } catch (e) {
        console.warn("[StudySnap] JSON parse failed:", e.message);
        return;
      }

      // Log every message type for debugging
      const keys = Object.keys(msg);
      if (!keys.includes("serverContent")) {
        console.log("[StudySnap] Non-content message:", JSON.stringify(msg).slice(0, 200));
      }

      const content = msg.serverContent;
      if (!content) return;

      if (content.outputTranscription?.text) {
        pendingText += content.outputTranscription.text;
        console.log("[StudySnap] Transcription chunk:", content.outputTranscription.text);
      }

      // Also check modelTurn parts as fallback
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.text) {
            pendingText += part.text;
            console.log("[StudySnap] Model part:", part.text);
          }
        }
      }

      if (content.turnComplete) {
        const fullText = pendingText.trim();
        pendingText = "";
        console.log("[StudySnap] Turn complete. Full response:", JSON.stringify(fullText));
        if (fullText.startsWith("PROBLEM_DETECTED:") && latestBase64) {
          const question = fullText.replace("PROBLEM_DETECTED:", "").trim();
          showToast(question, latestBase64);
        }
      }
    };

    ws.onerror = (e) => console.error("[StudySnap] WS error:", e);

    ws.onclose = (e) => {
      console.warn("[StudySnap] WS closed:", e.code, e.reason);
      clearInterval(captureInterval);
      captureInterval = null;
      if (isRecording) {
        // Connection dropped — reset UI
        isRecording = false;
        btn.textContent = "🔴";
        ring.style.display = "none";
      }
    };
  }

  // ── Frame capture ─────────────────────────────────────────────────────────

  function captureAndSend() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[StudySnap] captureAndSend skipped — WS not open, state:", ws?.readyState);
      return;
    }
    if (!chrome.runtime?.id) {
      console.error("[StudySnap] Extension context invalidated — please refresh this page.");
      stopMonitoring();
      return;
    }
    console.log("[StudySnap] Requesting frame capture...");

    // Ask the background service worker to capture the visible tab
    chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[StudySnap] captureTab error:", chrome.runtime.lastError.message);
        return;
      }
      if (!response?.dataUrl) {
        console.warn("[StudySnap] captureTab returned no dataUrl:", response);
        return;
      }

      const base64 = response.dataUrl.replace(/^data:image\/\w+;base64,/, "");
      console.log("[StudySnap] Frame captured, base64 length:", base64.length, "— sending to model");
      latestBase64 = base64;
      pendingText = "";

      ws.send(JSON.stringify({
        realtimeInput: {
          video: { data: base64, mimeType: "image/jpeg" },
          text: "Analyze this screen.",
        },
      }));
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  function cleanup() {
    clearInterval(captureInterval);
    captureInterval = null;
    if (ws) { ws.close(); ws = null; }
    pendingText = "";
    latestBase64 = null;
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(question, imageBase64) {
    dismissToast();

    toastEl = document.createElement("div");
    toastEl.id = "studysnap-toast";
    toastEl.innerHTML = `
      <div class="ss-toast-header">
        <span class="ss-dot"></span>
        <span class="ss-label">Problem Detected</span>
        <button class="ss-close" title="Dismiss">✕</button>
      </div>
      <p class="ss-question"></p>
      <div class="ss-actions">
        <button class="ss-find">Find Videos →</button>
        <button class="ss-dismiss">Dismiss</button>
      </div>
    `;

    toastEl.querySelector(".ss-question").textContent = question;
    toastEl.querySelector(".ss-close").addEventListener("click", dismissToast);
    toastEl.querySelector(".ss-dismiss").addEventListener("click", dismissToast);
    toastEl.querySelector(".ss-find").addEventListener("click", () => {
      dismissToast();
      stopMonitoring();
      chrome.runtime.sendMessage({ action: "findVideos", imageBase64 });
    });

    root.appendChild(toastEl);
    toastTimer = setTimeout(dismissToast, 10000);
  }

  function dismissToast() {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (toastEl) { toastEl.remove(); toastEl = null; }
  }
})();
