import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SplitText from "../SplitText";

describe("SplitText", () => {
  it("exposes the real string to assistive tech via aria-label", () => {
    render(<SplitText text="Vijaya Bhaskar" />);
    expect(screen.getByLabelText("Vijaya Bhaskar")).toBeInTheDocument();
  });

  it("hides individual character spans from assistive tech", () => {
    const { container } = render(<SplitText text="Hi" />);
    const charSpans = container.querySelectorAll(".split-char");
    expect(charSpans).toHaveLength(2);
    charSpans.forEach((span) => expect(span).toHaveAttribute("aria-hidden", "true"));
  });

  it("staggers each character's animation-delay from baseDelayMs", () => {
    const { container } = render(<SplitText text="Hi" baseDelayMs={100} staggerMs={20} />);
    const charSpans = container.querySelectorAll(".split-char");
    expect(charSpans[0]).toHaveStyle({ animationDelay: "100ms" });
    expect(charSpans[1]).toHaveStyle({ animationDelay: "120ms" });
  });

  it("does not wrap whitespace in a split-char span", () => {
    const { container } = render(<SplitText text="A B" />);
    expect(container.querySelectorAll(".split-char")).toHaveLength(2);
  });
});
