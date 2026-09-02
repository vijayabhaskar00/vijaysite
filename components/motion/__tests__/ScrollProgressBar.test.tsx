import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SceneProvider } from "@/lib/scene";
import ScrollProgressBar from "../ScrollProgressBar";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const withProvider = (ui: React.ReactElement) => <SceneProvider>{ui}</SceneProvider>;

describe("ScrollProgressBar", () => {
  it("renders no server markup (purely additive client enhancement)", () => {
    const html = renderToStaticMarkup(withProvider(<ScrollProgressBar />));
    expect(html).toBe("");
  });

  it("mounts a decorative bar when the document is scrollable", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 5000, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true });
    const { container } = render(withProvider(<ScrollProgressBar />));
    const bar = container.querySelector('[data-testid="scroll-progress-bar"]');
    expect(bar).not.toBeNull();
    expect(bar).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing when the document is not tall enough to scroll", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 700, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true });
    const { container } = render(withProvider(<ScrollProgressBar />));
    expect(container.querySelector('[data-testid="scroll-progress-bar"]')).toBeNull();
  });
});
