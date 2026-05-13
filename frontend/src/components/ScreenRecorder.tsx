"use client";

import { useEffect, useState } from "react";
import { getLiveApiMode, LIVE_API_MODE_KEY, type LiveApiMode } from "./LiveApiSetting";
import ScreenRecorderLive from "./ScreenRecorderLive";
import ScreenRecorderLite from "./ScreenRecorderLite";

export default function ScreenRecorder() {
  const [mode, setMode] = useState<LiveApiMode>("off");

  useEffect(() => {
    setMode(getLiveApiMode());

    // Stay in sync if the setting changes while the page is open
    const handler = (e: StorageEvent) => {
      if (e.key === LIVE_API_MODE_KEY) {
        setMode((e.newValue as LiveApiMode) ?? "off");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (mode === "on") return <ScreenRecorderLive />;
  return <ScreenRecorderLite />;
}
