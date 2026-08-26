"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/themeBootstrap";

export type Theme = "light" | "dark";

/** Custom event name dispatched on `window` whenever the theme changes --
 * lets any component (not just the toggle that made the change) react,
 * e.g. AmbientColorDrift re-picking its scroll-tinted color stops. A plain
 * DOM event rather than React context because the theme is bootstrapped
 * by an inline `<script>` (see lib/themeBootstrap.ts, wired up in
 * app/layout.tsx) before React ever mounts, so there's no Provider tree
 * it could sit above. */
const THEME_CHANGE_EVENT = "sitethemechange";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private browsing, disabled cookies) --
    // the theme still applies for this page view, it just won't persist.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Reads the current theme (re-rendering on any change, including one made
 * by another component's toggle) and exposes a setter. Starts at "light"
 * for the very first render so server and pre-hydration client markup
 * match exactly -- the real value (already painted by the bootstrap
 * script, see lib/themeBootstrap.ts) is picked up in the effect below,
 * same one-mount-then-correct pattern as useCanAnimate() in lib/motion.ts. */
export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(readTheme());
    const handleChange = () => setThemeState(readTheme());
    window.addEventListener(THEME_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const setTheme = (next: Theme) => applyTheme(next);

  return [theme, setTheme];
}
