import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

describe("tailwind design tokens", () => {
  it("defines the clay palette", () => {
    const colors = (config.theme?.extend as any)?.colors;
    expect(colors.cream).toBe("#FBF3E7");
    expect(colors.surface).toBe("#FFFDF8");
    expect(colors.ink).toBe("#2C2013");
    expect(colors.mute).toBe("#7A6B57");
    expect(colors["clay-amber"]).toEqual({ DEFAULT: "#E2701F", light: "#FBE0C4" });
    expect(colors["clay-teal"]).toEqual({ DEFAULT: "#3FA79E", light: "#D8F0EC" });
    expect(colors["clay-pink"]).toEqual({ DEFAULT: "#EF7FA8", light: "#FBE1E9" });
    expect(colors["clay-lavender"]).toEqual({ DEFAULT: "#7B87F5", light: "#E5E6FD" });
  });

  it("defines display/body font families backed by CSS variables", () => {
    const fonts = (config.theme?.extend as any)?.fontFamily;
    expect(fonts.display).toContain("var(--font-display)");
    expect(fonts.body).toContain("var(--font-body)");
    expect(fonts.mono).toBeUndefined();
  });

  it("defines the clay dual-shadow tokens", () => {
    const shadow = (config.theme?.extend as any)?.boxShadow;
    expect(shadow["clay-raised"]).toContain("rgba(44, 32, 19, 0.18)");
    expect(shadow["clay-pressed"]).toContain("inset");
  });
});
