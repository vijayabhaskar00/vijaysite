import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "../Footer";
import { social, site } from "@/content/site";

describe("Footer", () => {
  it("renders every approved social link opening in a new tab", () => {
    render(<Footer />);
    for (const item of social) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    }
  });

  it("includes the site name in the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(site.name))).toBeInTheDocument();
  });
});
