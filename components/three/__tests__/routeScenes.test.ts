import { describe, expect, it } from "vitest";
import { getSceneForPath } from "../routeScenes";

describe("getSceneForPath", () => {
  it("returns the home scene for '/'", () => {
    expect(getSceneForPath("/").variant).toBe("home");
  });

  it("normalizes a trailing slash (static export uses trailingSlash: true)", () => {
    expect(getSceneForPath("/about/").id).toBe(getSceneForPath("/about").id);
  });

  it("falls back to the drift scene for an unknown path", () => {
    const scene = getSceneForPath("/does-not-exist");
    expect(scene.variant).toBe("drift");
    expect(scene.keyframes).toEqual([]);
  });

  it("maps the 404 path shape to a drift scene", () => {
    expect(getSceneForPath("/404").variant).toBe("drift");
  });

  it("experience has a mid keyframe so the camera banks past the timeline", () => {
    const ats = getSceneForPath("/experience").keyframes.map((k) => k.at);
    expect(ats.some((a) => a > 0.3 && a < 0.7)).toBe(true);
  });

  it("every registered scene has keyframes sorted and spanning 0..1 (except drift)", () => {
    for (const path of ["/", "/about", "/experience", "/contact"]) {
      const { keyframes } = getSceneForPath(path);
      expect(keyframes.length).toBeGreaterThanOrEqual(2);
      expect(keyframes[0].at).toBe(0);
      expect(keyframes[keyframes.length - 1].at).toBe(1);
      const ats = keyframes.map((k) => k.at);
      expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    }
  });
});
