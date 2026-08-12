import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Header from "../Header";
import { nav } from "@/content/site";

describe("Header", () => {
  it("renders a link for every nav entry with the correct href", () => {
    render(<Header />);
    for (const item of nav) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
    }
  });
});
