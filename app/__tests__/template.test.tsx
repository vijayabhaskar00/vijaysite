import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, beforeEach, vi } from "vitest";
import Template, { __resetTemplateStateForTests } from "../template";

describe("Template", () => {
  beforeEach(() => {
    __resetTemplateStateForTests();
    vi.unstubAllGlobals();
  });

  it("renders the very first page load with no motion wrapper (no baked opacity)", () => {
    const { container } = render(
      <Template>
        <p>Hello</p>
      </Template>
    );
    expect(container.firstChild).toHaveTextContent("Hello");
    // Plain passthrough: no wrapper element, no inline style at all.
    expect(container.querySelector("[style]")).not.toBeInTheDocument();
  });

  it("plays an enter transition on a subsequent navigation within the same session", () => {
    render(
      <Template>
        <p>First</p>
      </Template>
    );
    const { container } = render(
      <Template>
        <p>Second</p>
      </Template>
    );
    expect(container.querySelector("[style]")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server-rendered markup, even for the Nth page rendered in one process", () => {
    // Static export/SSR reuses one Node process across every route, so
    // `hasEnteredOnce` may already be true by the time a later page's HTML
    // is generated. Server rendering (no effects ever run) must still be
    // deterministic regardless of that flag -- this is the actual
    // mechanism that broke: `npm run build` baked opacity:0 into every
    // page generated after the first one.
    render(
      <Template>
        <p>Earlier page in the same build</p>
      </Template>
    );
    const html = renderToStaticMarkup(
      <Template>
        <p>Later page in the same build</p>
      </Template>
    );
    expect(html).not.toMatch(/opacity:\s*0/);
    expect(html).toBe("<p>Later page in the same build</p>");
  });

  it("skips the transition when reduced motion is preferred, even after the first load", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    render(
      <Template>
        <p>First</p>
      </Template>
    );
    const { container } = render(
      <Template>
        <p>Second</p>
      </Template>
    );
    expect(container.querySelector("[style]")).not.toBeInTheDocument();
  });
});
