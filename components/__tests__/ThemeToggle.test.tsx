import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ThemeToggle from "../ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("labels itself by the theme a click would switch to, starting from light", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("switches the page to dark on click, and relabels itself for the switch back", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("never bakes opacity:0 into its rendered markup", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.innerHTML).not.toMatch(/opacity:\s*0(?!\.)/);
  });
});
