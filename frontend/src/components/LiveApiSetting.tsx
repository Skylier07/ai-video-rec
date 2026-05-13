"use client";

import { useEffect, useState } from "react";

export type LiveApiMode = "on" | "off";
export const LIVE_API_MODE_KEY = "studysnap_use_live_api";

export function getLiveApiMode(): LiveApiMode {
  if (typeof window === "undefined") return "off";
  return (localStorage.getItem(LIVE_API_MODE_KEY) as LiveApiMode) ?? "off";
}

export default function LiveApiSetting() {
  const [mode, setMode] = useState<LiveApiMode>("off");

  useEffect(() => {
    const stored = localStorage.getItem(LIVE_API_MODE_KEY) as LiveApiMode | null;
    if (stored) setMode(stored);
  }, []);

  function handleChange(next: LiveApiMode) {
    setMode(next);
    localStorage.setItem(LIVE_API_MODE_KEY, next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-on-surface">Detection Engine</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Which Gemini API the screen recorder uses to detect problems.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          disabled
          title="Live API mode is currently unavailable"
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left opacity-40 cursor-not-allowed ${
            mode === "on"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest"
          }`}
        >
          <span className="material-symbols-outlined mt-0.5 text-on-surface-variant">
            bolt
          </span>
          <div>
            <p className="text-sm font-bold text-on-surface">
              Live API
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">WebSocket stream — currently unavailable</p>
          </div>
        </button>

        <button
          onClick={() => handleChange("off")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            mode === "off"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${mode === "off" ? "text-primary" : "text-on-surface-variant"}`}>
            image_search
          </span>
          <div>
            <p className={`text-sm font-bold ${mode === "off" ? "text-primary" : "text-on-surface"}`}>
              Standard
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Polls screen every 5s via generateContent</p>
          </div>
        </button>
      </div>
    </div>
  );
}
