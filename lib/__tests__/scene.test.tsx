import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SceneProvider, useScene } from "../scene";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function Probe() {
  const { tier, canFly, scene } = useScene();
  return (
    <div>
      <span data-testid="tier">{tier ?? "pending"}</span>
      <span data-testid="canfly">{String(canFly)}</span>
      <span data-testid="variant">{scene.variant}</span>
    </div>
  );
}

describe("SceneProvider", () => {
  it("renders children immediately, before the tier resolves", () => {
    render(
      <SceneProvider>
        <p>page content</p>
      </SceneProvider>
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("resolves to the static tier in jsdom (no WebGL2) and reports canFly=false", async () => {
    render(
      <SceneProvider>
        <Probe />
      </SceneProvider>
    );
    await waitFor(() => expect(screen.getByTestId("tier")).toHaveTextContent("static"));
    expect(screen.getByTestId("canfly")).toHaveTextContent("false");
  });

  it("exposes the home scene for the default test path", async () => {
    render(
      <SceneProvider>
        <Probe />
      </SceneProvider>
    );
    await waitFor(() => expect(screen.getByTestId("variant")).toHaveTextContent("home"));
  });

  it("adds no server markup of its own around children", () => {
    const html = renderToStaticMarkup(
      <SceneProvider>
        <p>hi</p>
      </SceneProvider>
    );
    expect(html).toBe("<p>hi</p>");
  });

  it("useScene throws when used outside the provider", () => {
    const spy = () => renderToStaticMarkup(<Probe />);
    expect(spy).toThrow(/useScene must be used within a SceneProvider/);
  });
});
