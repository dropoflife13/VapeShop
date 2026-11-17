"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored =
      (localStorage.getItem("vv-theme") as ThemeMode | null) ?? "system";
    setMode(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current =
        (localStorage.getItem("vv-theme") as ThemeMode | null) ?? "system";
      if (current === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function cycleTheme() {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    localStorage.setItem("vv-theme", next);
    applyTheme(next);
  }

  const label =
    mode === "light"
      ? "Theme: Light (switch to Dark)"
      : mode === "dark"
      ? "Theme: Dark (switch to System)"
      : "Theme: System (switch to Light)";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] text-[var(--text-primary)] backdrop-blur-md transition-all duration-200 hover:border-[#F58A1F] hover:text-[#F58A1F] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F]"
    >
      {mode === "light" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : mode === "dark" ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Monitor className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
