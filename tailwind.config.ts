import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E7",
        surface: "#FFFDF8",
        ink: "#2C2013",
        mute: "#7A6B57",
        "clay-amber": { DEFAULT: "#E2701F", light: "#FBE0C4" },
        "clay-teal": { DEFAULT: "#3FA79E", light: "#D8F0EC" },
        "clay-pink": { DEFAULT: "#EF7FA8", light: "#FBE1E9" },
        "clay-lavender": { DEFAULT: "#7B87F5", light: "#E5E6FD" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "clay-raised": "8px 8px 20px rgba(44, 32, 19, 0.18), -6px -6px 16px rgba(255, 255, 255, 0.8)",
        "clay-pressed": "inset 4px 4px 10px rgba(44, 32, 19, 0.18), inset -4px -4px 10px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
