"use client";

import { useEffect, useState } from "react";

export type ScanInterval = "5000" | "15000";
export const SCAN_INTERVAL_KEY = "studysnap_scan_interval";

export function getScanInterval(): number {
  if (typeof window === "undefined") return 5000;
  return parseInt(localStorage.getItem(SCAN_INTERVAL_KEY) ?? "5000", 10);
}

export default function ScanIntervalSetting() {
  const [interval, setInterval_] = useState<ScanInterval>("5000");

  useEffect(() => {
    const stored = localStorage.getItem(SCAN_INTERVAL_KEY) as ScanInterval | null;
    if (stored) setInterval_(stored);
  }, []);

  function handleChange(next: ScanInterval) {
    setInterval_(next);
    localStorage.setItem(SCAN_INTERVAL_KEY, next);
    // Notify extension content.js (if installed) so it can persist to chrome.storage.local
    window.postMessage({ type: "STUDYSNAP_SET_INTERVAL", intervalMs: parseInt(next, 10) }, "*");
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-on-surface">Scan Frequency</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          How often the screen recorder checks for homework problems.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => handleChange("5000")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            interval === "5000"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${interval === "5000" ? "text-primary" : "text-on-surface-variant"}`}>
            speed
          </span>
          <div>
            <p className={`text-sm font-bold ${interval === "5000" ? "text-primary" : "text-on-surface"}`}>
              Every 5 seconds
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Faster detection, higher CPU usage</p>
          </div>
        </button>

        <button
          onClick={() => handleChange("15000")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            interval === "15000"
              ? "border-secondary bg-secondary-container/30"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${interval === "15000" ? "text-secondary" : "text-on-surface-variant"}`}>
            battery_saver
          </span>
          <div>
            <p className={`text-sm font-bold ${interval === "15000" ? "text-secondary" : "text-on-surface"}`}>
              Every 15 seconds
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Slower detection, lower CPU usage</p>
          </div>
        </button>
      </div>
    </div>
  );
}
