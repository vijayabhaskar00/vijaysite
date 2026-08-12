import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PhotoFrame from "../PhotoFrame";

describe("PhotoFrame", () => {
  it("renders the image with correct src, alt and dimensions", () => {
    render(
      <PhotoFrame src="https://example.com/photo.jpg" alt="Test alt" width={320} height={320} />
    );
    const img = screen.getByAltText("Test alt");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("width", "320");
    expect(img).toHaveAttribute("height", "320");
  });
});
