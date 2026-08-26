import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTheme } from "../theme";
import { THEME_STORAGE_KEY } from "../themeBootstrap";

describe("useTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("reflects whatever theme is already on the DOM once mounted (set by the pre-hydration bootstrap script)", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const { result } = renderHook(() => useTheme());
    await act(async () => {});
    expect(result.current[0]).toBe("dark");
  });

  it("defaults to light when the DOM carries no data-theme at all", async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => {});
    expect(result.current[0]).toBe("light");
  });

  it("setTheme updates the DOM attribute and persists the choice to localStorage", async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => {
      result.current[1]("dark");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(result.current[0]).toBe("dark");
  });

  it("propagates a theme change made by one hook consumer to every other mounted consumer", async () => {
    const a = renderHook(() => useTheme());
    const b = renderHook(() => useTheme());

    await act(async () => {
      a.result.current[1]("dark");
    });

    expect(a.result.current[0]).toBe("dark");
    expect(b.result.current[0]).toBe("dark");
  });
});
