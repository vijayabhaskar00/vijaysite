import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

describe("tailwind design tokens", () => {
  it("defines the dark studio palette", () => {
    const colors = (config.theme?.extend as any)?.colors;
    expect(colors.ink).toBe("#0B0B0C");
    expect(colors.paper).toBe("#F2F1ED");
    expect(colors.amber).toBe("#FFB020");
    expect(colors.signal).toBe("#5B8CFF");
    expect(colors.mute).toBe("#8B8B90");
    expect(colors.line).toBe("#232326");
  });

  it("defines display/body/mono font families backed by CSS variables", () => {
    const fonts = (config.theme?.extend as any)?.fontFamily;
    expect(fonts.display).toContain("var(--font-display)");
    expect(fonts.body).toContain("var(--font-body)");
    expect(fonts.mono).toContain("var(--font-mono)");
  });
});
