import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCounter from "../StatCounter";

describe("StatCounter", () => {
  it("renders a numeric value as plain text when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(<StatCounter value="7" />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders a non-numeric value as plain text, unchanged", () => {
    render(<StatCounter value="HYD" />);
    expect(screen.getByText("HYD")).toBeInTheDocument();
  });

  it("applies the passed className to the rendered element", () => {
    render(<StatCounter value="7" className="text-amber" />);
    expect(screen.getByText("7")).toHaveClass("text-amber");
  });
});
