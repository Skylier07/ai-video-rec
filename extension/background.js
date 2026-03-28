// StudySnap Extension — Service Worker
// Orchestrates offscreen lifecycle, tab capture, and opening StudySnap.

const OFFSCREEN_URL = chrome.runtime.getURL("offscreen.html");

// ── Offscreen helpers ────────────────────────────────────────────────────────

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["USER_MEDIA"],
      justification: "Gemini Live API WebSocket + frame capture timer",
    });
  }
}

async function closeOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) await chrome.offscreen.closeDocument();
}

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── Start monitoring ──────────────────────────────────────────────────────
  if (msg.action === "start") {
    const tabId = sender.tab?.id;
    if (!tabId) { sendResponse({ ok: false }); return; }

    // Persist tab ID to session storage — survives service worker restarts
    chrome.storage.session.set({ activeTabId: tabId }, async () => {
      await ensureOffscreen();
      // Offscreen will send "offscreenReady" when its listener is registered.
      // We'll respond to that instead of a fixed delay — no race condition.
      sendResponse({ ok: true });
    });
    return true; // async
  }

  // ── Offscreen doc is ready — send init data ───────────────────────────────
  if (msg.action === "offscreenReady") {
    chrome.storage.session.get(["activeTabId"], ({ activeTabId }) => {
      if (activeTabId) {
        chrome.runtime.sendMessage({ action: "init", tabId: activeTabId })
          .catch(() => {}); // offscreen receives this
      }
    });
  }

  // ── Capture current visible tab (called by offscreen timer) ──────────────
  if (msg.action === "captureTab") {
    // captureVisibleTab() with no windowId = captures currently active tab.
    // This is actually what we want: capture whatever the student is looking at.
    chrome.tabs.captureVisibleTab(
      null, // current focused window's active tab
      { format: "jpeg", quality: 70 },
      (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          sendResponse({ error: true });
          return;
        }
        // Send frame ONLY back to the requester (offscreen) via response —
        // avoids broadcasting base64 frame data to all content scripts.
        sendResponse({ dataUrl });
      }
    );
    return true; // REQUIRED: async callback
  }

  // ── Problem detected — tell the content script to show toast ─────────────
  if (msg.action === "problemDetected") {
    chrome.storage.session.get(["activeTabId"], ({ activeTabId }) => {
      if (!activeTabId) return;
      chrome.tabs.sendMessage(activeTabId, {
        action: "showToast",
        question: msg.question,
        imageBase64: msg.imageBase64,
      }).catch(() => {}); // tab may have navigated away
    });
  }

  // ── Open StudySnap processing page ───────────────────────────────────────
  if (msg.action === "findVideos") {
    handleFindVideos(msg.imageBase64).then(() => sendResponse({ ok: true }));
    return true;
  }

  // ── Stop monitoring ───────────────────────────────────────────────────────
  if (msg.action === "stop") {
    handleStop().then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Stop ─────────────────────────────────────────────────────────────────────

async function handleStop() {
  chrome.runtime.sendMessage({ action: "stop" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 200));
  await closeOffscreen();
  await chrome.storage.session.remove(["activeTabId"]);
}

// ── Find Videos ──────────────────────────────────────────────────────────────

async function handleFindVideos(imageBase64) {
  const data = {
    imageBase64,
    imageMimeType: "image/jpeg",
    text: null,
  };

  await chrome.storage.session.set({ studysnap_input: data });

  const tab = await chrome.tabs.create({ url: "http://localhost:3000/processing" });

  // Once the page has fully loaded, bridge the data into its localStorage
  const listener = (tabId, info) => {
    if (tabId !== tab.id || info.status !== "complete") return;
    chrome.tabs.onUpdated.removeListener(listener);

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (payload) => {
        localStorage.setItem("studysnap_input", JSON.stringify(payload));
      },
      args: [data],
    }).catch(console.error);
  };

  chrome.tabs.onUpdated.addListener(listener);
}
