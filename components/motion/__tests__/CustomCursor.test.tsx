import { render, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach, vi } from "vitest";
import CustomCursor from "../CustomCursor";

function mockMatchMedia(overrides: Record<string, boolean>) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: overrides[query] ?? false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("CustomCursor", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("has-custom-cursor");
  });

  it("renders nothing when matchMedia is unavailable (safe default)", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { container } = render(<CustomCursor />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for coarse pointers (touch)", () => {
    vi.stubGlobal(
      "matchMedia",
      mockMatchMedia({ "(pointer: fine)": false, "(prefers-reduced-motion: reduce)": false })
    );
    const { container } = render(<CustomCursor />);
    expect(container).toBeEmptyDOMElement();
    expect(document.documentElement).not.toHaveClass("has-custom-cursor");
  });

  it("renders nothing when reduced motion is preferred, even on a fine pointer", () => {
    vi.stubGlobal(
      "matchMedia",
      mockMatchMedia({ "(pointer: fine)": true, "(prefers-reduced-motion: reduce)": true })
    );
    const { container } = render(<CustomCursor />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the ring and dot for a fine pointer with no motion preference", () => {
    vi.stubGlobal(
      "matchMedia",
      mockMatchMedia({ "(pointer: fine)": true, "(prefers-reduced-motion: reduce)": false })
    );
    const { container } = render(<CustomCursor />);
    expect(container.querySelector(".cursor-dot")).toBeInTheDocument();
    expect(container.querySelector(".cursor-ring")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("has-custom-cursor");
  });
});
