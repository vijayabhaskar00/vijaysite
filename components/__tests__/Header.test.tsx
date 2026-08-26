import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Header from "../Header";
import { nav } from "@/content/site";

// next.config.mjs sets trailingSlash: true, so usePathname() really
// returns paths like "/about/" in production -- a mock without the
// trailing slash would hide a real mismatch bug (see Header.tsx).
const usePathnameMock = vi.fn(() => "/about/");
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

describe("Header", () => {
  afterEach(() => {
    usePathnameMock.mockReset().mockReturnValue("/about/");
  });

  it("renders a link for every nav entry with the correct href", () => {
    render(<Header />);
    for (const item of nav) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("marks the current route's nav link as the active page, and no other, even though usePathname() has a trailing slash the href doesn't", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("marks Home as active on the root path, which has no trailing slash to strip", () => {
    usePathnameMock.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute("aria-current");
  });

  it("never bakes opacity:0 into its rendered markup", () => {
    const { container } = render(<Header />);
    expect(container.innerHTML).not.toMatch(/opacity:\s*0(?!\.)/);
  });

  it("aligns the nav+theme-toggle row to the top, not the center, so the toggle doesn't float between the nav's wrapped rows on narrow viewports", () => {
    // Regression test: with items-center, the toggle -- a flex sibling of
    // <nav>, not of the individual pills -- centered against the *whole*
    // wrapped height once <nav>'s <ul> wrapped to a second row on mobile,
    // landing it visually straddling both rows instead of level with the
    // first. Confirmed live with Playwright at a 390px viewport.
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const wrapper = nav.parentElement;
    expect(wrapper).toHaveClass("items-start");
    expect(wrapper).not.toHaveClass("items-center");
  });
});
