import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../page";
import { site } from "@/content/site";

// Composition-level SSR-safety test: every individual motion component
// (Waypoint, IntroOverlay) already has its own SSR test guarding against
// `opacity: 0` leaking into server-rendered markup, but nothing previously
// exercised the actual page composition end to end. This locks in, at the
// level that matters for a real visitor's first paint, the guarantee that
// was manually verified against the built `out/` directory during the final
// review of the 3D fly-through motion work: no waypoint (or anything else on
// the homepage) is ever born invisible before JS hydrates.
describe("HomePage (SSR composition)", () => {
  it("never bakes opacity:0 into server-rendered markup anywhere in the full composition", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).not.toMatch(/opacity:\s*0(?!\.)/);
  });

  it("includes the key content anchors from every section, unconditionally visible", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain(site.name);
    expect(html).toContain("View full profile");
    expect(html).toContain("View full timeline");
    expect(html).toContain("Get in touch");
  });
});
