"use client";

import Magnetic from "@/components/motion/Magnetic";
import { useTheme } from "@/lib/theme";

const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40";

/** Sun icon shown while the site is in light mode, offered as the control
 * to switch *to* dark -- stroke-based, 20px grid, so it scales and
 * recolors with `currentColor` like every other icon in the app. */
function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5 4.1 4.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      <path d="M17 11.2A7.2 7.2 0 0 1 8.8 3a7.2 7.2 0 1 0 8.2 8.2Z" />
    </svg>
  );
}

/** A pill icon button that flips the site between light and dark, styled
 * to match the header's other pill controls (navLinkClass) rather than
 * reusing it directly -- this one is square (icon-only) and never carries
 * an "active" fill. Renders the light-mode icon on the server/pre-hydration
 * render (useTheme() starts at "light", see lib/theme.ts) so there is
 * never a hydration mismatch; the bootstrap script has usually already
 * applied the real theme by the time this paints, so the icon corrects
 * itself in the same frame rather than visibly flipping after. */
export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === "dark";

  return (
    <Magnetic>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-ink shadow-clay-raised transition-[background-color,color,transform] duration-300 motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface active:shadow-clay-pressed ${focusRingClass}`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>
    </Magnetic>
  );
}
