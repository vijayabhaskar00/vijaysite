import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

// Design token colors/shadows live as CSS custom properties in
// app/globals.css (see the comment above :root there) so dark mode can
// re-theme every bg-*/text-*/shadow-* utility class with zero component
// changes -- tailwind.config.ts itself only holds rgb(var(--x) /
// <alpha-value>) references (the "R G B" triple format, not hex, is what
// keeps opacity-modifier utilities like text-ink/70 working -- see that
// file's comment). These tests check both halves of that split: the
// config points at the right variable in the right wrapper, and
// globals.css's :root block still defines those variables with the exact
// palette values the site was designed around.
const globalsCss = readFileSync("./app/globals.css", "utf-8");

function rootVarValue(name: string): string | undefined {
  const rootBlock = globalsCss.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  return rootBlock.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();
}

function rgbVar(name: string): string {
  return `rgb(var(--${name}) / <alpha-value>)`;
}

describe("tailwind design tokens", () => {
  it("points every clay palette color at rgb(var(--x) / <alpha-value>), not a bare var() or literal hex", () => {
    const colors = (config.theme?.extend as any)?.colors;
    expect(colors.cream).toBe(rgbVar("color-cream"));
    expect(colors.surface).toBe(rgbVar("color-surface"));
    expect(colors.ink).toBe(rgbVar("color-ink"));
    expect(colors.mute).toBe(rgbVar("color-mute"));
    expect(colors["clay-amber"]).toEqual({ DEFAULT: rgbVar("color-clay-amber"), light: rgbVar("color-clay-amber-light") });
    expect(colors["clay-teal"]).toEqual({ DEFAULT: rgbVar("color-clay-teal"), light: rgbVar("color-clay-teal-light") });
    expect(colors["clay-pink"]).toEqual({ DEFAULT: rgbVar("color-clay-pink"), light: rgbVar("color-clay-pink-light") });
    expect(colors["clay-lavender"]).toEqual({ DEFAULT: rgbVar("color-clay-lavender"), light: rgbVar("color-clay-lavender-light") });
  });

  it("defines every referenced color variable in globals.css's light (:root) palette as an R G B triple", () => {
    expect(rootVarValue("--color-cream")).toBe("251 243 231"); // #fbf3e7
    expect(rootVarValue("--color-surface")).toBe("255 253 248"); // #fffdf8
    expect(rootVarValue("--color-ink")).toBe("44 32 19"); // #2c2013
    expect(rootVarValue("--color-mute")).toBe("122 107 87"); // #7a6b57
    expect(rootVarValue("--color-clay-amber")).toBe("226 112 31"); // #e2701f
    expect(rootVarValue("--color-clay-amber-light")).toBe("251 224 196"); // #fbe0c4
    expect(rootVarValue("--color-clay-teal")).toBe("63 167 158"); // #3fa79e
    expect(rootVarValue("--color-clay-teal-light")).toBe("216 240 236"); // #d8f0ec
    expect(rootVarValue("--color-clay-pink")).toBe("239 127 168"); // #ef7fa8
    expect(rootVarValue("--color-clay-pink-light")).toBe("251 225 233"); // #fbe1e9
    expect(rootVarValue("--color-clay-lavender")).toBe("123 135 245"); // #7b87f5
    expect(rootVarValue("--color-clay-lavender-light")).toBe("229 230 253"); // #e5e6fd
  });

  it("defines display/body font families backed by CSS variables", () => {
    const fonts = (config.theme?.extend as any)?.fontFamily;
    expect(fonts.display).toContain("var(--font-display)");
    expect(fonts.body).toContain("var(--font-body)");
    expect(fonts.mono).toBeUndefined();
  });

  it("defines the clay dual-shadow tokens as CSS custom properties", () => {
    const shadow = (config.theme?.extend as any)?.boxShadow;
    expect(shadow["clay-raised"]).toBe("var(--shadow-clay-raised)");
    expect(shadow["clay-pressed"]).toBe("var(--shadow-clay-pressed)");
    expect(rootVarValue("--shadow-clay-raised")).toContain("rgba(44, 32, 19, 0.18)");
    expect(rootVarValue("--shadow-clay-pressed")).toContain("inset");
  });
});
