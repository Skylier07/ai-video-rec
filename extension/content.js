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

  const SYSTEM_INSTRUCTION_MANUAL = `You are a study assistant. You can see the student's screen and hear them speak.

RULE: The moment a student expresses ANY intent to find videos or get help — call find_videos IMMEDIATELY. Do NOT ask for confirmation. Do NOT say "would you like me to...". Do NOT say "is that something you'd like...". Just call find_videos right away.

Trigger words/phrases that ALWAYS mean call find_videos immediately (no questions asked):
- "find videos", "find me videos", "search for videos", "look up videos"
- "I'm stuck on", "I don't understand", "help me with", "I need help with"
- "find help", "get help", "search for", "look up"
- "can you find", "can you search", "can you look up"
- Any request for educational resources about a topic

Two cases for what to pass as the question argument:
1. Student names a concept verbally → use that concept (e.g. "Newton's second law")
2. Student refers to screen → use the exact question text visible on screen

After calling find_videos, respond briefly: "Searching for that now!"

For pure casual conversation or questions you can answer directly yourself, respond normally without calling find_videos.`;

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
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter(d => d.kind === "audioinput");
      console.log("[StudySnap] Available mic devices:", mics.map(d => `${d.deviceId.slice(0,8)}… ${d.label || "(no label)"}`).join(" | "));
    });

    // echoCancellation prevents model playback audio from re-triggering VAD
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    })
      .then((stream) => {
        micStream = stream;
        const track = stream.getAudioTracks()[0];
        console.log("[StudySnap] Mic track label:", track?.label || "(no label)", "| readyState:", track?.readyState);

        micAudioContext = new AudioContext();
        const actualRate = micAudioContext.sampleRate;
        console.log("[StudySnap] AudioContext sampleRate:", actualRate);

        const source = micAudioContext.createMediaStreamSource(stream);
        micProcessor = micAudioContext.createScriptProcessor(4096, 1, 1);

        micProcessor.onaudioprocess = (e) => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;

          const float32Data = e.inputBuffer.getChannelData(0);
          const int16Data = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, float32Data[i] * 32768));
          }
          const base64 = arrayBufferToBase64(int16Data.buffer);
          ws.send(JSON.stringify({
            realtimeInput: { audio: { data: base64, mimeType: `audio/pcm;rate=${actualRate}` } },
          }));
        };

        source.connect(micProcessor);
        micProcessor.connect(micAudioContext.destination);
        console.log("[StudySnap] Mic capture started — speak naturally, VAD handles turn detection");
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
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              languageCode: "en-US",
            },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: detectionMode === "manual" ? SYSTEM_INSTRUCTION_MANUAL : SYSTEM_INSTRUCTION_AUTO }],
            role: "user",
          },
          ...(detectionMode === "manual" && {
            // VAD is enabled by default — server detects when the user starts/stops speaking.
            // No activityStart/End needed; just stream mic audio continuously.
            tools: [{
              functionDeclarations: [{
                name: "find_videos",
                description: "Trigger a video search for a homework problem or concept. Use when the student asks to find videos — either for a visible on-screen problem or for a concept they mentioned verbally.",
                parameters: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The question or concept to search for. Either the exact question text visible on screen, or the concept/topic the student mentioned verbally.",
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
      // Wait for setupComplete before sending frames — content sent before
      // setup is acknowledged is dropped by the server.
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

      // Start capture loop only after server confirms setup is complete
      if (msg.setupComplete) {
        console.log("[StudySnap] Setup complete — starting capture");
        captureInterval = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
        captureAndSend(); // first frame immediately
        if (detectionMode === "manual") startMicCapture();
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
              const rateMatch = mime.match(/rate=(\d+)/);
              const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
              playAudioChunk(part.inlineData.data, sampleRate);
            }
          }
        }
      }

      if (content.inputTranscription?.text) {
        console.log("[StudySnap] User said:", content.inputTranscription.text);
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

        // Case-insensitive match — audio transcription may lowercase "PROBLEM_DETECTED:"
        if (detectionMode === "auto" && latestBase64) {
          const match = fullText.match(/problem[_\s]?detected[:\s]+(.+)/i);
          if (match) showToast(match[1].trim(), latestBase64);
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

      // Auto mode: clientContent + turnComplete creates an explicit turn the model
      // must respond to. realtimeInput.text is not a valid API field and is silently
      // dropped — text must go through clientContent.
      // Manual mode: realtimeInput.video provides visual context alongside mic audio.
      const frameMsg = detectionMode === "manual"
        ? { realtimeInput: { video: { data: base64, mimeType: "image/jpeg" } } }
        : {
            clientContent: {
              turns: [{
                role: "user",
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: base64 } },
                  { text: "Analyze this screen." },
                ],
              }],
              turnComplete: true,
            },
          };
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
      chrome.runtime.sendMessage({ action: "findVideos", imageBase64, questionText: question });
    });

    root.appendChild(toastEl);
    toastTimer = setTimeout(dismissToast, 10000);
  }

  function dismissToast() {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (toastEl) { toastEl.remove(); toastEl = null; }
  }
})();
