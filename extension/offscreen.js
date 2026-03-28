// StudySnap Extension — Offscreen Document
// Manages the 5s capture timer and the Gemini Live API WebSocket.

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
let targetTabId = null;
let targetWindowId = null;

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "init") {
    targetTabId = msg.tabId;
    targetWindowId = msg.windowId;
    startWebSocket();
  }

  if (msg.action === "frame") {
    handleFrame(msg.dataUrl);
  }

  if (msg.action === "stop") {
    cleanup();
  }
});

// ── WebSocket ─────────────────────────────────────────────────────────────────

function startWebSocket() {
  if (ws) ws.close();
  pendingText = "";

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("[StudySnap] WS connected");
    // Send setup message
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

    // Start capture loop
    captureInterval = setInterval(requestCapture, CAPTURE_INTERVAL_MS);
    // First capture shortly after connect
    setTimeout(requestCapture, 500);
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
      if (fullText.startsWith("PROBLEM_DETECTED:")) {
        const question = fullText.replace("PROBLEM_DETECTED:", "").trim();
        chrome.runtime.sendMessage({
          action: "problemDetected",
          question,
          imageBase64: latestBase64,
        });
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

function requestCapture() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  // Ask background to capture the monitored tab
  chrome.runtime.sendMessage({ action: "captureTab", tabId: targetTabId, windowId: targetWindowId });
}

function handleFrame(dataUrl) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  // Strip the data URL prefix
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
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
}
