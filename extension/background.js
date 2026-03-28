// StudySnap Extension — Service Worker
// Orchestrates tab capture, offscreen document lifecycle, and tab opening.

const OFFSCREEN_URL = chrome.runtime.getURL("offscreen.html");

// Track which tab is being monitored
let activeTabId = null;
let activeWindowId = null;

// ── Offscreen document helpers ──────────────────────────────────────────────

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["USER_MEDIA"],
      justification: "Run Gemini Live API WebSocket and frame capture timer",
    });
  }
}

async function closeOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) await chrome.offscreen.closeDocument();
}

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "start") {
    handleStart(sender.tab).then(() => sendResponse({ ok: true }));
    return true; // async
  }

  if (msg.action === "stop") {
    handleStop().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === "captureTab") {
    // Offscreen doc asking for a frame from the monitored tab
    chrome.tabs.captureVisibleTab(
      activeWindowId,
      { format: "jpeg", quality: 70 },
      (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) return;
        chrome.runtime.sendMessage({ action: "frame", dataUrl });
      }
    );
  }

  if (msg.action === "problemDetected") {
    // Forward to the content script on the monitored tab
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, {
        action: "showToast",
        question: msg.question,
        imageBase64: msg.imageBase64,
      });
    }
  }

  if (msg.action === "findVideos") {
    handleFindVideos(msg.imageBase64).then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

async function handleStart(tab) {
  if (!tab) return;
  activeTabId = tab.id;
  activeWindowId = tab.windowId;

  await ensureOffscreen();

  // Give offscreen doc a moment to load, then init
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: "init",
      tabId: activeTabId,
      windowId: activeWindowId,
    });
  }, 300);
}

// ── Stop ─────────────────────────────────────────────────────────────────────

async function handleStop() {
  chrome.runtime.sendMessage({ action: "stop" }).catch(() => {});
  await new Promise((r) => setTimeout(r, 200));
  await closeOffscreen();
  activeTabId = null;
  activeWindowId = null;
}

// ── Find Videos ──────────────────────────────────────────────────────────────

async function handleFindVideos(imageBase64) {
  const data = {
    imageBase64,
    imageMimeType: "image/jpeg",
    text: null,
  };

  // Store so the processing page can pick it up
  await chrome.storage.local.set({ studysnap_input: data });

  // Get the StudySnap URL from the content script's config (injected)
  // Fall back to localhost:3000 if not available
  const url = "http://localhost:3000/processing";

  const tab = await chrome.tabs.create({ url });

  // Once the page has loaded, inject localStorage bridge
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
