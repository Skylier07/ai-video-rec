"use client";

import { useEffect, useState } from "react";

export type DetectionMode = "auto" | "manual";
export const DETECTION_MODE_KEY = "studysnap_detection_mode";

export function getDetectionMode(): DetectionMode {
  if (typeof window === "undefined") return "auto";
  return (localStorage.getItem(DETECTION_MODE_KEY) as DetectionMode) ?? "auto";
}

export default function DetectionModeSetting() {
  const [mode, setMode] = useState<DetectionMode>("auto");

  useEffect(() => {
    const stored = localStorage.getItem(DETECTION_MODE_KEY) as DetectionMode | null;
    if (stored) setMode(stored);
  }, []);

  function handleChange(next: DetectionMode) {
    setMode(next);
    localStorage.setItem(DETECTION_MODE_KEY, next);
    // Notify extension content.js to persist to chrome.storage.local
    window.postMessage({ type: "STUDYSNAP_SET_DETECTION_MODE", mode: next }, "*");
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-on-surface">Detection Mode</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          How the screen recorder finds homework problems.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => handleChange("auto")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            mode === "auto"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${mode === "auto" ? "text-primary" : "text-on-surface-variant"}`}>
            visibility
          </span>
          <div>
            <p className={`text-sm font-bold ${mode === "auto" ? "text-primary" : "text-on-surface"}`}>
              Auto Detect
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Scans screen automatically every few seconds</p>
          </div>
        </button>

        <button
          onClick={() => handleChange("manual")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            mode === "manual"
              ? "border-secondary bg-secondary-container/30"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${mode === "manual" ? "text-secondary" : "text-on-surface-variant"}`}>
            mic
          </span>
          <div>
            <p className={`text-sm font-bold ${mode === "manual" ? "text-secondary" : "text-on-surface"}`}>
              Voice Triggered
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Speak to Gemini to find videos on demand</p>
          </div>
        </button>
      </div>
    </div>
  );
}
