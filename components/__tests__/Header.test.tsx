import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "../Header";
import { nav } from "@/content/site";

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
}));

describe("Header", () => {
  it("renders a link for every nav entry with the correct href", () => {
    render(<Header />);
    for (const item of nav) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("marks the current route's nav link as the active page, and no other", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("never bakes opacity:0 into its rendered markup", () => {
    const { container } = render(<Header />);
    expect(container.innerHTML).not.toMatch(/opacity:\s*0(?!\.)/);
  });
});
