// StudySnap Extension — Content Script
// Injects the floating button and problem-detected toast onto every webpage.

(function () {
  // Prevent double-injection
  if (document.getElementById("studysnap-root")) return;

  let isRecording = false;
  let toastEl = null;
  let toastTimer = null;

  // ── Root container ──────────────────────────────────────────────────────────

  const root = document.createElement("div");
  root.id = "studysnap-root";
  document.body.appendChild(root);

  // ── Floating button ─────────────────────────────────────────────────────────

  const btn = document.createElement("button");
  btn.id = "studysnap-btn";
  btn.title = "Start StudySnap screen monitor";
  btn.textContent = "🔴";
  root.appendChild(btn);

  // Ping ring (shown while recording)
  const ring = document.createElement("div");
  ring.id = "studysnap-ring";
  ring.style.display = "none";
  root.appendChild(ring);

  btn.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  function startRecording() {
    isRecording = true;
    btn.textContent = "■";
    btn.title = "Stop StudySnap screen monitor";
    ring.style.display = "block";
    chrome.runtime.sendMessage({ action: "start" });
  }

  function stopRecording() {
    isRecording = false;
    btn.textContent = "🔴";
    btn.title = "Start StudySnap screen monitor";
    ring.style.display = "none";
    dismissToast();
    chrome.runtime.sendMessage({ action: "stop" });
  }

  // ── Toast ───────────────────────────────────────────────────────────────────

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

    // Set question text safely (no innerHTML injection)
    toastEl.querySelector(".ss-question").textContent = question;

    toastEl.querySelector(".ss-close").addEventListener("click", dismissToast);
    toastEl.querySelector(".ss-dismiss").addEventListener("click", dismissToast);
    toastEl.querySelector(".ss-find").addEventListener("click", () => {
      dismissToast();
      stopRecording();
      chrome.runtime.sendMessage({ action: "findVideos", imageBase64 });
    });

    root.appendChild(toastEl);

    // Auto-dismiss after 10s
    toastTimer = setTimeout(dismissToast, 10000);
  }

  function dismissToast() {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (toastEl) { toastEl.remove(); toastEl = null; }
  }

  // ── Message listener ────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "showToast") {
      showToast(msg.question, msg.imageBase64);
    }
  });
})();
