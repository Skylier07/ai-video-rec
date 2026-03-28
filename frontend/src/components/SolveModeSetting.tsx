"use client";

import { useEffect, useState } from "react";

export type SolveMode = "accurate" | "fast";
export const SOLVE_MODE_KEY = "studysnap_solve_mode";

export function getSolveMode(): SolveMode {
  if (typeof window === "undefined") return "accurate";
  return (localStorage.getItem(SOLVE_MODE_KEY) as SolveMode) ?? "accurate";
}

export default function SolveModeSetting() {
  const [mode, setMode] = useState<SolveMode>("accurate");

  useEffect(() => {
    setMode(getSolveMode());
  }, []);

  function handleChange(next: SolveMode) {
    setMode(next);
    localStorage.setItem(SOLVE_MODE_KEY, next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-on-surface">Solution Quality</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Choose between a faster or more thorough AI model for step-by-step solutions.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => handleChange("accurate")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            mode === "accurate"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${mode === "accurate" ? "text-primary" : "text-on-surface-variant"}`}>
            psychology
          </span>
          <div>
            <p className={`text-sm font-bold ${mode === "accurate" ? "text-primary" : "text-on-surface"}`}>
              Accurate
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Gemini Pro — slower, more thorough</p>
          </div>
        </button>

        <button
          onClick={() => handleChange("fast")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            mode === "fast"
              ? "border-secondary bg-secondary-container/30"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${mode === "fast" ? "text-secondary" : "text-on-surface-variant"}`}>
            bolt
          </span>
          <div>
            <p className={`text-sm font-bold ${mode === "fast" ? "text-secondary" : "text-on-surface"}`}>
              Fast
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Gemini Flash — faster, less detailed</p>
          </div>
        </button>
      </div>
    </div>
  );
}
