import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrgMark from "../OrgMark";

describe("OrgMark", () => {
  it("renders the real logo image for an org present in the logo map", () => {
    render(<OrgMark org="Microsoft" />);
    const img = screen.getByAltText("Microsoft logo");
    expect(img).toHaveAttribute("src", "/logos/microsoft.svg");
  });

  it("falls back to a monogram for an org with no logo file", () => {
    render(<OrgMark org="Tsearch.in" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("TS")).toBeInTheDocument();
  });
});
