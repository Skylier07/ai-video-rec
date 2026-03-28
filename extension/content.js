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
  let micStream = null;
  let micAudioContext = null;
  let micProcessor = null;
  let playbackContext = null;
  let nextPlayTime = 0;

  const SYSTEM_INSTRUCTION_AUTO = `You are a homework problem detector. You receive frames from a student's screen.

Your ONLY job:
- If you can clearly see a homework question, math problem, or exam question being displayed, respond with EXACTLY:
  PROBLEM_DETECTED: [copy the question text here]
- If there is no clear homework problem visible, respond with EXACTLY:
  NO_PROBLEM
- Never add any other text, explanation, or commentary.`;

  const SYSTEM_INSTRUCTION_MANUAL = `You are a friendly study assistant. You can see the student's screen and hear them speak.

When the student asks you to find videos, search for help, or requests assistance with a problem on their screen:
1. Call the find_videos function with the exact question text you can see on screen.
2. Also respond naturally and briefly (e.g. "Sure, finding videos on that now!").

For casual conversation or questions you can answer directly, respond helpfully without calling find_videos.
If no question is visible when they ask for videos, say: "I don't see a question on screen yet — can you point me to it?"`;

  const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
  const CAPTURE_INTERVAL_MS = 5000;

  // ── Detection mode (auto | manual) ───────────────────────────────────────
  let detectionMode = "auto";

  chrome.storage.local.get({ detection_mode: "auto" }, (result) => {
    detectionMode = result.detection_mode;
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type === "STUDYSNAP_SET_DETECTION_MODE") {
      detectionMode = event.data.mode;
      chrome.storage.local.set({ detection_mode: event.data.mode });
    }
  });

  // Keep detectionMode in sync across ALL tabs when storage changes.
  // If currently recording, stop immediately — the active session used the old mode's setup.
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.detection_mode) {
      detectionMode = changes.detection_mode.newValue;
      console.log("[StudySnap] Detection mode updated:", detectionMode);
      if (isRecording) stopMonitoring();
    }
  });

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

  // Push-to-talk send button (manual mode only — appears above main button)
  const speakBtn = document.createElement("button");
  speakBtn.id = "studysnap-speak";
  speakBtn.title = "Tap after speaking — send your question to the model";
  speakBtn.textContent = "🎤";
  speakBtn.style.display = "none";
  root.appendChild(speakBtn);

  speakBtn.addEventListener("click", () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    pendingText = "";
    speakBtn.textContent = "⏳";
    speakBtn.disabled = true;

    // Capture a fresh frame so the model sees exactly what's on screen right now,
    // then immediately send activityEnd so both arrive in the same turn.
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
        if (response?.dataUrl) {
          const base64 = response.dataUrl.replace(/^data:image\/\w+;base64,/, "");
          latestBase64 = base64;
          ws.send(JSON.stringify({ realtimeInput: { video: { data: base64, mimeType: "image/jpeg" } } }));
        }
        ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
        console.log("[StudySnap] Fresh frame + activityEnd sent — waiting for model response");
      });
    } else {
      ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
      console.log("[StudySnap] activityEnd sent — waiting for model response");
    }
  });

  btn.addEventListener("click", () => {
    if (isRecording) stopMonitoring(); else startMonitoring();
  });

  // ── Start / Stop ──────────────────────────────────────────────────────────

  function startMonitoring() {
    isRecording = true;
    btn.textContent = "■";
    btn.title = "Stop StudySnap screen monitor";
    ring.style.display = "block";
    if (detectionMode === "manual") speakBtn.style.display = "flex";
    openWebSocket();
  }

  function stopMonitoring() {
    isRecording = false;
    btn.textContent = "🔴";
    btn.title = "Start StudySnap screen monitor";
    ring.style.display = "none";
    speakBtn.style.display = "none";
    speakBtn.textContent = "🎤";
    speakBtn.disabled = false;
    dismissToast();
    stopMicCapture();
    stopPlayback();
    cleanup();
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function startMicCapture() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        micStream = stream;
        micAudioContext = new AudioContext({ sampleRate: 16000 });
        const source = micAudioContext.createMediaStreamSource(stream);
        micProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);

        micProcessor.onaudioprocess = (e) => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          const float32Data = e.inputBuffer.getChannelData(0);
          const int16Data = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, float32Data[i] * 32768));
          }
          const base64 = arrayBufferToBase64(int16Data.buffer);
          ws.send(JSON.stringify({
            realtimeInput: { audio: { data: base64, mimeType: "audio/pcm;rate=16000" } },
          }));
        };

        source.connect(micProcessor);
        micProcessor.connect(micAudioContext.destination);
        console.log("[StudySnap] Mic capture started");
        // Signal to model that user activity is beginning (VAD disabled — manual control)
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
          console.log("[StudySnap] activityStart sent");
        }
      })
      .catch((err) => {
        console.error("[StudySnap] Mic access denied:", err.message);
      });
  }

  function stopMicCapture() {
    if (micProcessor) { micProcessor.disconnect(); micProcessor = null; }
    if (micAudioContext) { micAudioContext.close(); micAudioContext = null; }
    if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
    console.log("[StudySnap] Mic capture stopped");
  }

  function playAudioChunk(base64Data, sampleRate = 24000) {
    if (!playbackContext) {
      playbackContext = new AudioContext({ sampleRate });
      nextPlayTime = 0;
    }
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    const audioBuffer = playbackContext.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
    const source = playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackContext.destination);
    const startTime = Math.max(playbackContext.currentTime, nextPlayTime);
    source.start(startTime);
    nextPlayTime = startTime + audioBuffer.duration;
  }

  function stopPlayback() {
    if (playbackContext) { playbackContext.close(); playbackContext = null; }
    nextPlayTime = 0;
  }

  // ── Gemini Live API WebSocket ─────────────────────────────────────────────

  function openWebSocket() {
    if (ws) ws.close();
    pendingText = "";

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[StudySnap] WS connected");
      const setupMsg = {
        setup: {
          model: "models/gemini-3.1-flash-live-preview",
          // Native audio models only support AUDIO modality — TEXT causes 1011.
          // Both modes use AUDIO + outputAudioTranscription for text.
          // Manual mode additionally declares the find_videos function tool.
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              languageCode: "en-US",
            },
          },
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: detectionMode === "manual" ? SYSTEM_INSTRUCTION_MANUAL : SYSTEM_INSTRUCTION_AUTO }],
            role: "user",
          },
          ...(detectionMode === "manual" && {
            // Disable automatic VAD so we control turn boundaries with activityStart/End
            realtimeInputConfig: {
              automaticActivityDetection: { disabled: true },
            },
            tools: [{
              functionDeclarations: [{
                name: "find_videos",
                description: "Trigger a video search for the homework problem currently visible on the student's screen.",
                parameters: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The exact question text visible on screen.",
                    },
                  },
                  required: ["question"],
                },
              }],
            }],
          }),
        },
      };
      ws.send(JSON.stringify(setupMsg));

      captureInterval = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
      setTimeout(captureAndSend, 800);
      if (detectionMode === "manual") {
        startMicCapture();
      }
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

      // ── Tool calls (top-level, NOT inside serverContent) ───────────────────
      if (msg.toolCall?.functionCalls) {
        for (const call of msg.toolCall.functionCalls) {
          if (call.name === "find_videos") {
            const question = call.args?.question || "";
            console.log("[StudySnap] find_videos called with:", question);
            // Live API requires a toolResponse to continue the session
            ws.send(JSON.stringify({
              toolResponse: {
                functionResponses: [{
                  id: call.id,
                  name: call.name,
                  response: { status: "searching" },
                }],
              },
            }));
            if (latestBase64) showToast(question, latestBase64);
          }
        }
        // Re-enable speak button and open next activity window
        if (isRecording && detectionMode === "manual") {
          speakBtn.textContent = "🎤";
          speakBtn.disabled = false;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
            console.log("[StudySnap] activityStart sent — ready for next question");
          }
        }
      }

      const content = msg.serverContent;
      if (!content) return;

      // Play Gemini's audio response (manual mode only)
      if (detectionMode === "manual" && content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData) {
            const mime = part.inlineData.mimeType || "";
            console.log("[StudySnap] Audio part mimeType:", mime);
            if (mime.startsWith("audio/pcm")) {
              // Extract sample rate from mimeType (e.g. "audio/pcm;rate=24000")
              const rateMatch = mime.match(/rate=(\d+)/);
              const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
              playAudioChunk(part.inlineData.data, sampleRate);
            }
          }
        }
      }

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

        if (detectionMode === "auto" && fullText.startsWith("PROBLEM_DETECTED:") && latestBase64) {
          const question = fullText.replace("PROBLEM_DETECTED:", "").trim();
          showToast(question, latestBase64);
        }
        // Manual mode: video trigger handled by find_videos toolCall above.
        // Re-enable speak button and open next activity window.
        if (isRecording && detectionMode === "manual") {
          speakBtn.textContent = "🎤";
          speakBtn.disabled = false;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
            console.log("[StudySnap] activityStart sent — ready for next question");
          }
        }
      }
    };

    ws.onerror = (e) => console.error("[StudySnap] WS error:", e);

    ws.onclose = (e) => {
      console.warn("[StudySnap] WS closed:", e.code, e.reason);
      clearInterval(captureInterval);
      captureInterval = null;
      stopMicCapture();
      stopPlayback();
      if (isRecording) {
        // Connection dropped — reset UI
        isRecording = false;
        btn.textContent = "🔴";
        ring.style.display = "none";
        speakBtn.style.display = "none";
        speakBtn.textContent = "🎤";
        speakBtn.disabled = false;
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

      // Auto mode: include text prompt to trigger per-frame analysis.
      // Manual mode: video only — Gemini responds to voice, not each frame.
      const frameMsg = detectionMode === "manual"
        ? { realtimeInput: { video: { data: base64, mimeType: "image/jpeg" } } }
        : { realtimeInput: { video: { data: base64, mimeType: "image/jpeg" }, text: "Analyze this screen." } };
      ws.send(JSON.stringify(frameMsg));
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
