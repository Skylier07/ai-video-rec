// StudySnap Extension — Service Worker
// Minimal: captures the visible tab on demand, and opens the StudySnap processing page.
// All WebSocket / timer / detection logic lives in content.js (persistent for tab lifetime).

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── Capture current visible tab ───────────────────────────────────────────
  if (msg.action === "captureTab") {
    chrome.tabs.captureVisibleTab(
      null, // current focused window's active tab
      { format: "jpeg", quality: 70 },
      (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          sendResponse({ error: true });
          return;
        }
        sendResponse({ dataUrl });
      }
    );
    return true; // REQUIRED: keep channel open for async callback
  }

  // ── Open StudySnap processing page with captured frame ───────────────────
  if (msg.action === "findVideos") {
    handleFindVideos(msg.imageBase64).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function handleFindVideos(imageBase64) {
  const data = {
    imageBase64,
    imageMimeType: "image/jpeg",
    text: null,
  };

  await chrome.storage.session.set({ studysnap_input: data });

  const tab = await chrome.tabs.create({ url: "http://localhost:3000/processing" });

  // Once the page has loaded, bridge the data into its localStorage
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
