import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeHero from "../HomeHero";
import { site } from "@/content/site";

describe("HomeHero", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the hero name, description, and credentials marquee", () => {
    render(<HomeHero />);
    expect(screen.getByText(site.name)).toBeInTheDocument();
    expect(screen.getByText(site.description)).toBeInTheDocument();
  });

  it("renders with no baked motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    const { container } = render(<HomeHero />);
    expect(container.innerHTML).not.toMatch(/style="/);
  });

  it("mounts the animated branch without throwing once IntersectionObserver is available", async () => {
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    render(<HomeHero />);

    await waitFor(() => {
      expect(screen.getByText(site.name)).toBeInTheDocument();
    });
  });
});
