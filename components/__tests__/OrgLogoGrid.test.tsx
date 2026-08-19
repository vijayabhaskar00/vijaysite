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

  it("renders exactly one card per unique org, with no shader canvas", () => {
    const { container } = render(<OrgLogoGrid />);
    expect(container.querySelectorAll("canvas").length).toBe(0);
    const grid = container.firstElementChild;
    expect(grid?.children.length).toBe(orgNames.length);
  });
});
