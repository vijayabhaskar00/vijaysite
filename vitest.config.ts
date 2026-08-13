import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Agent-managed git worktrees live under .claude/worktrees/ inside this
    // repo tree, each with its own node_modules. Without this exclude,
    // running tests from the main checkout also picks up a worktree's test
    // files, whose nearest node_modules (the worktree's own) shadows the
    // root's React copy — two React instances loaded at once crash every
    // hook call ("Cannot read properties of null (reading 'useRef')").
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
