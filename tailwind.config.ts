import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Every value here reads an "R G B" triple CSS custom property
      // defined in app/globals.css (:root for light, :root[data-theme=
      // "dark"] for dark) through Tailwind's documented rgb(var(--x) /
      // <alpha-value>) pattern -- see the comment above :root in
      // globals.css for why it's a triple rather than a resolved color:
      // that's what keeps opacity-modifier utilities (text-ink/70,
      // focus-visible:ring-clay-amber/40, ...) working, since Tailwind
      // substitutes <alpha-value> with the requested opacity at build
      // time and can only do that when it isn't blocked by an already-
      // resolved color function. tailwind.config.test.ts checks these
      // stay in sync with the literal values defined in globals.css.
      colors: {
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        mute: "rgb(var(--color-mute) / <alpha-value>)",
        "clay-amber": {
          DEFAULT: "rgb(var(--color-clay-amber) / <alpha-value>)",
          light: "rgb(var(--color-clay-amber-light) / <alpha-value>)",
        },
        "clay-teal": {
          DEFAULT: "rgb(var(--color-clay-teal) / <alpha-value>)",
          light: "rgb(var(--color-clay-teal-light) / <alpha-value>)",
        },
        "clay-pink": {
          DEFAULT: "rgb(var(--color-clay-pink) / <alpha-value>)",
          light: "rgb(var(--color-clay-pink-light) / <alpha-value>)",
        },
        "clay-lavender": {
          DEFAULT: "rgb(var(--color-clay-lavender) / <alpha-value>)",
          light: "rgb(var(--color-clay-lavender-light) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "clay-raised": "var(--shadow-clay-raised)",
        "clay-pressed": "var(--shadow-clay-pressed)",
      },
    },
  },
  plugins: [],
};

export default config;
