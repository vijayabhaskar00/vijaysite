import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SplitText from "../SplitText";

describe("SplitText", () => {
  it("exposes the real string to assistive tech via aria-label", () => {
    render(<SplitText text="Vijaya Bhaskar" />);
    expect(screen.getByLabelText("Vijaya Bhaskar")).toBeInTheDocument();
  });

  it("hides individual character spans from assistive tech", () => {
    render(<SplitText text="Hi" />);
    const charSpans = screen.getAllByTestId("split-char");
    expect(charSpans).toHaveLength(2);
    charSpans.forEach((span) => expect(span).toHaveAttribute("aria-hidden", "true"));
  });

  it("does not wrap whitespace in a split-char span", () => {
    render(<SplitText text="A B" />);
    expect(screen.getAllByTestId("split-char")).toHaveLength(2);
  });

  it("accepts baseDelayMs and staggerMs without breaking the rendered character spans", () => {
    render(<SplitText text="Hi" baseDelayMs={100} staggerMs={20} />);
    expect(screen.getAllByTestId("split-char")).toHaveLength(2);
  });

  it("keeps each word's characters inside one inline-block wrapper, so a line can only break between words, never inside one", () => {
    render(<SplitText text="A B" />);
    const [charA, charB] = screen.getAllByTestId("split-char");
    expect(charA.parentElement).toHaveClass("inline-block");
    expect(charB.parentElement).toHaveClass("inline-block");
    expect(charA.parentElement).not.toBe(charB.parentElement);
  });
});
