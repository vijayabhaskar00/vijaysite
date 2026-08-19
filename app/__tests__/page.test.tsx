import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../page";
import { site } from "@/content/site";

// Composition-level SSR-safety test: locks in the guarantee that no
// section of the homepage is ever born invisible before JS hydrates —
// Reveal/SplitText/StatCounter are all "visible by default, JS opts into
// an animated state" components, so server-rendered markup must never
// contain a baked opacity:0.
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
