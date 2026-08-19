import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AmbientColorDrift from "../AmbientColorDrift";

describe("AmbientColorDrift", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when IntersectionObserver is unavailable (jsdom has none)", () => {
    const { container } = render(<AmbientColorDrift />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an aria-hidden, pointer-events-none full-bleed layer once IntersectionObserver is available", async () => {
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    const { container } = render(<AmbientColorDrift />);

    const layer = await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    expect(layer).toHaveClass("pointer-events-none", "fixed", "inset-0", "-z-30");
    expect(layer).toHaveAttribute("style");
  });
});
