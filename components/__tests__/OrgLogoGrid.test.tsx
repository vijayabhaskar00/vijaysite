import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { orgNames } from "@/content/site";
import OrgLogoGrid from "../OrgLogoGrid";

describe("OrgLogoGrid", () => {
  it("renders one card with a visible name for every unique org", () => {
    render(<OrgLogoGrid />);
    for (const org of orgNames) {
      expect(screen.getByText(org)).toBeInTheDocument();
    }
  });

  it("does not mount the WebGL shader layer without a resolved 'full' tier", () => {
    // deviceTier resolution is async and jsdom has no WebGL2, so it settles
    // to "static" -- the shader canvas must never appear in that case.
    const { container } = render(<OrgLogoGrid />);
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("positions logos via CSS only -- no JS-computed inline transform", () => {
    const { container } = render(<OrgLogoGrid />);
    const items = container.querySelectorAll(".org-orbit-item");
    expect(items.length).toBe(orgNames.length);
    for (const item of Array.from(items)) {
      expect((item as HTMLElement).style.transform).toBe("");
    }
  });
});
