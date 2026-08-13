import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

describe("tailwind design tokens", () => {
  it("defines the Warm Regional Identity palette", () => {
    const colors = (config.theme?.extend as any)?.colors;
    expect(colors.bg).toBe("#FBF3E7");
    expect(colors.ink).toBe("#2B211A");
    expect(colors.terracotta).toBe("#C1512D");
    expect(colors.ochre).toBe("#B3792C");
    expect(colors.teal).toBe("#1F5C56");
    expect(colors.night).toBe("#221A14");
  });

  it("defines display/body font families backed by CSS variables", () => {
    const fonts = (config.theme?.extend as any)?.fontFamily;
    expect(fonts.display).toContain("var(--font-fraunces)");
    expect(fonts.body).toContain("var(--font-public-sans)");
  });
});
