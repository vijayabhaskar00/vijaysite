import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "../page";
import { SceneProvider } from "@/lib/scene";
import { site } from "@/content/site";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const withProvider = (ui: React.ReactElement) => <SceneProvider>{ui}</SceneProvider>;

// Composition-level SSR-safety test: locks in the guarantee that no
// section of the homepage is ever born invisible before JS hydrates —
// Waypoint/SplitText/StatCounter are all "visible by default, JS opts into
// an animated state" components, so server-rendered markup must never
// contain a baked opacity:0. SceneProvider renders no wrapper markup of
// its own (see lib/__tests__/scene.test.tsx).
describe("HomePage (SSR composition)", () => {
  it("never bakes opacity:0 into server-rendered markup anywhere in the full composition", () => {
    const html = renderToStaticMarkup(withProvider(<HomePage />));
    expect(html).not.toMatch(/opacity:\s*0(?!\.)/);
  });

  it("includes the key content anchors from every section, unconditionally visible", () => {
    const html = renderToStaticMarkup(withProvider(<HomePage />));
    expect(html).toContain(site.name);
    expect(html).toContain("View full profile");
    expect(html).toContain("View full timeline");
    expect(html).toContain("Get in touch");
  });

  it("still renders every section's linked content with the fly-through wrapper", () => {
    render(withProvider(<HomePage />));
    expect(screen.getByRole("link", { name: /view full profile/i })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: /view full timeline/i })).toHaveAttribute(
      "href",
      "/experience"
    );
    expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
  });
});
