import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FBF3E7",
        ink: "#2B211A",
        terracotta: "#C1512D",
        ochre: "#B3792C",
        teal: "#1F5C56",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
