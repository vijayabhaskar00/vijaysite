import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SmoothScroll from "../SmoothScroll";

const prefersReducedMotionMock = vi.fn(() => false);
vi.mock("@/components/motion/deviceTier", () => ({
  prefersReducedMotion: () => prefersReducedMotionMock(),
}));

const destroyMock = vi.fn();
const rafMock = vi.fn();
const lenisConstructorMock = vi.fn();
vi.mock("lenis", () => ({
  default: class MockLenis {
    constructor(options: unknown) {
      lenisConstructorMock(options);
    }
    raf(time: number) {
      rafMock(time);
    }
    destroy() {
      destroyMock();
    }
  },
}));

vi.mock("lenis/dist/lenis.css", () => ({}));

describe("SmoothScroll", () => {
  beforeEach(() => {
    // jsdom has no matchMedia by default (see deviceTier.test.ts) --
    // SmoothScroll deliberately no-ops without it (see its early return),
    // so every test here needs a stub for the component's real logic
    // path to run at all.
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    prefersReducedMotionMock.mockReturnValue(false);
  });

  it("renders nothing", () => {
    const { container } = render(<SmoothScroll />);
    expect(container).toBeEmptyDOMElement();
  });

  it("constructs a Lenis instance when motion is not reduced", () => {
    render(<SmoothScroll />);
    expect(lenisConstructorMock).toHaveBeenCalledTimes(1);
  });

  it("never constructs a Lenis instance when the visitor prefers reduced motion", () => {
    prefersReducedMotionMock.mockReturnValue(true);
    render(<SmoothScroll />);
    expect(lenisConstructorMock).not.toHaveBeenCalled();
  });

  it("destroys its Lenis instance on unmount", () => {
    const { unmount } = render(<SmoothScroll />);
    expect(lenisConstructorMock).toHaveBeenCalledTimes(1);
    unmount();
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
