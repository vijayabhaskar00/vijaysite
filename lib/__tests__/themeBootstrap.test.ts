import { describe, expect, it } from "vitest";
import { themeBootstrapScript, THEME_STORAGE_KEY } from "../themeBootstrap";

describe("themeBootstrapScript", () => {
  it("reads the stored theme, falls back to the OS preference, and writes data-theme -- all before React mounts", () => {
    const script = themeBootstrapScript();
    expect(script).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('document.documentElement.setAttribute("data-theme"');
    // Must never throw in an environment without localStorage (private
    // browsing, disabled storage) -- the whole point of running this
    // before hydration is that a thrown error there would break the page.
    expect(script).toMatch(/^\(function\(\)\{try\{/);
  });

  it("is valid, immediately-invoked JS", () => {
    expect(() => new Function(themeBootstrapScript())).not.toThrow();
  });
});
