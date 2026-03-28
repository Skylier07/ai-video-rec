// StudySnap Extension — Offscreen Document
// Manages the 5s capture timer and the Gemini Live API WebSocket.
// Lives persistently while monitoring is active (unlike the service worker).

const SYSTEM_INSTRUCTION = `You are a homework problem detector. You receive frames from a student's screen.

Your ONLY job:
- If you can clearly see a homework question, math problem, or exam question being displayed, respond with EXACTLY:
  PROBLEM_DETECTED: [copy the question text here]
- If there is no clear homework problem visible, respond with EXACTLY:
  NO_PROBLEM
- Never add any other text, explanation, or commentary.`;

const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
const CAPTURE_INTERVAL_MS = 5000;

let ws = null;
let captureInterval = null;
let pendingText = "";
let latestBase64 = null;

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "init") {
    console.log("[StudySnap offscreen] init received, starting WS");
    startWebSocket();
  }

  if (msg.action === "stop") {
    cleanup();
  }
  // Note: "frame" messages no longer used — frames come back via sendResponse
  // in the "captureTab" request/response cycle.
});

// ── Signal to background that listener is registered and we're ready ─────────
chrome.runtime.sendMessage({ action: "offscreenReady" }).catch(() => {});

// ── WebSocket ─────────────────────────────────────────────────────────────────

function startWebSocket() {
  if (ws) ws.close();
  pendingText = "";

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("[StudySnap] WS connected");

    ws.send(JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
          role: "user",
        },
      },
    }));

    // Start capture loop after WS is open
    captureInterval = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
    setTimeout(captureAndSend, 800); // first frame shortly after connect
  };

  ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    const content = msg.serverContent;
    if (!content) return;

    if (content.outputTranscription?.text) {
      pendingText += content.outputTranscription.text;
    }

    if (content.turnComplete && latestBase64) {
      const fullText = pendingText.trim();
      pendingText = "";
      console.log("[StudySnap] Model response:", fullText);
      if (fullText.startsWith("PROBLEM_DETECTED:")) {
        const question = fullText.replace("PROBLEM_DETECTED:", "").trim();
        chrome.runtime.sendMessage({
          action: "problemDetected",
          question,
          imageBase64: latestBase64,
        }).catch(() => {});
      }
    }
  };

  ws.onerror = (e) => {
    console.error("[StudySnap] WS error:", e);
  };

  ws.onclose = (e) => {
    console.warn("[StudySnap] WS closed:", e.code, e.reason);
    clearInterval(captureInterval);
    captureInterval = null;
  };
}

// ── Frame capture ─────────────────────────────────────────────────────────────

function captureAndSend() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Ask background to capture via sendMessage + response (frame only goes to us)
  chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
    if (chrome.runtime.lastError || !response?.dataUrl) {
      console.warn("[StudySnap] captureTab failed:", chrome.runtime.lastError?.message);
      return;
    }
    sendFrame(response.dataUrl);
  });
}

function sendFrame(dataUrl) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Strip data URL prefix → raw base64
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  latestBase64 = base64;
  pendingText = "";

  ws.send(JSON.stringify({
    realtimeInput: {
      video: { data: base64, mimeType: "image/jpeg" },
      text: "Analyze this screen.",
    },
  }));
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function cleanup() {
  clearInterval(captureInterval);
  captureInterval = null;
  if (ws) {
    ws.close();
    ws = null;
  }
  pendingText = "";
  latestBase64 = null;
  console.log("[StudySnap] Monitoring stopped");
}
