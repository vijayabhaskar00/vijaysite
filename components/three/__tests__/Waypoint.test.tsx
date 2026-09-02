import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SceneProvider } from "@/lib/scene";
import Waypoint from "../Waypoint";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const wrap = (ui: React.ReactElement) => <SceneProvider>{ui}</SceneProvider>;

describe("Waypoint", () => {
  it("renders its content regardless of scroll position", () => {
    render(
      wrap(
        <Waypoint range={[0.4, 0.6]}>
          <p>About preview</p>
        </Waypoint>
      )
    );
    expect(screen.getByText("About preview")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server markup for a later-scheduled section", () => {
    const html = renderToStaticMarkup(
      wrap(
        <Waypoint range={[0.7, 0.9]}>
          <p>Contact preview</p>
        </Waypoint>
      )
    );
    expect(html).toContain("Contact preview");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("passes className through", () => {
    const { container } = render(
      wrap(
        <Waypoint className="my-section">
          <p>x</p>
        </Waypoint>
      )
    );
    expect(container.querySelector(".my-section")).not.toBeNull();
  });
});
