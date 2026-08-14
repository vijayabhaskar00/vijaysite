import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import IntroOverlay from "../IntroOverlay";

describe("IntroOverlay", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    document.body.style.overflow = "";
  });

  it("renders nothing when not enabled", () => {
    render(<IntroOverlay enabled={false} />);
    expect(screen.queryByText("Scroll to begin")).not.toBeInTheDocument();
  });

  it("shows the intro when enabled and the session hasn't seen it yet", () => {
    render(<IntroOverlay enabled />);
    expect(screen.getByText("Scroll to begin")).toBeInTheDocument();
  });

  it("does not show again once the session has already seen it", () => {
    window.sessionStorage.setItem("intro-shown", "1");
    render(<IntroOverlay enabled />);
    expect(screen.queryByText("Scroll to begin")).not.toBeInTheDocument();
  });

  it("marks the session as seen and hides itself when dismissed by click", () => {
    render(<IntroOverlay enabled />);
    fireEvent.click(screen.getByTestId("intro-overlay"));
    expect(window.sessionStorage.getItem("intro-shown")).toBe("1");
  });

  it("never renders any markup on the server -- it's a purely additive client enhancement", () => {
    const html = renderToStaticMarkup(<IntroOverlay enabled />);
    expect(html).toBe("");
  });

  it("applies a zoom transform alongside the existing fade/rise on the name", async () => {
    render(<IntroOverlay enabled />);
    const name = screen.getByText("Vijaya Bhaskar");
    // Framer Motion writes `initial`/`animate` values to the element's
    // inline `transform` style on mount. The scale motion prop should be
    // present in the transform string; asserting it contains "scale(" locks
    // in the zoom behavior specifically.
    await waitFor(() => expect(name.style.transform).toMatch(/scale\(/));
  });
});
