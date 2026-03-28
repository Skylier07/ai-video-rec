"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const THEME_KEY = "studysnap_theme";

export function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as Theme) ?? "light";
}

/** Drop this in the root layout to restore the theme on page load. */
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem('${THEME_KEY}');if(t==='dark')document.documentElement.classList.add('dark');})();`,
      }}
    />
  );
}

/** Drop this anywhere in settings to show the theme picker. */
export default function ThemeToggleSetting() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function handleChange(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-on-surface">Appearance</p>
        <p className="text-xs text-on-surface-variant mt-0.5">Choose how StudySnap looks.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => handleChange("light")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            theme === "light"
              ? "border-primary bg-primary-fixed/20"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${theme === "light" ? "text-primary" : "text-on-surface-variant"}`}>
            light_mode
          </span>
          <div>
            <p className={`text-sm font-bold ${theme === "light" ? "text-primary" : "text-on-surface"}`}>Light</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Default light theme</p>
          </div>
        </button>

        <button
          onClick={() => handleChange("dark")}
          className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            theme === "dark"
              ? "border-secondary bg-secondary-container/30"
              : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50"
          }`}
        >
          <span className={`material-symbols-outlined mt-0.5 ${theme === "dark" ? "text-secondary" : "text-on-surface-variant"}`}>
            dark_mode
          </span>
          <div>
            <p className={`text-sm font-bold ${theme === "dark" ? "text-secondary" : "text-on-surface"}`}>Dark</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Black theme</p>
          </div>
        </button>
      </div>
    </div>
  );
}
