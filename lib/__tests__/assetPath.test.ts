import { describe, expect, it, afterEach } from "vitest";
import { resolveAssetPath } from "@/lib/assetPath";

describe("resolveAssetPath", () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
  });

  it("prefixes root-relative paths with the configured basePath", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/vijaysite";
    expect(resolveAssetPath("/photo.jpg")).toBe("/vijaysite/photo.jpg");
  });

  it("leaves root-relative paths untouched when no basePath is set", () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    expect(resolveAssetPath("/photo.jpg")).toBe("/photo.jpg");
  });

  it("passes absolute URLs through unchanged", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/vijaysite";
    expect(resolveAssetPath("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
  });
});
