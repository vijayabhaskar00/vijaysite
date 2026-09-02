export interface CameraKeyframe {
  /** Scroll progress (0..1) at which the camera reaches this pose. */
  at: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export type SceneVariant = "home" | "about" | "experience" | "contact" | "drift";

export interface RouteScene {
  id: string;
  variant: SceneVariant;
  keyframes: CameraKeyframe[];
}

// Homepage: fly in from far, settle on the hero (~0.15), then drift up and
// back past the section waypoints. Calm -- no lookAt turn sharper than a
// gentle bank.
const HOME: RouteScene = {
  id: "home",
  variant: "home",
  keyframes: [
    { at: 0, position: [0, 0, 14], lookAt: [0, 0, 0] },
    { at: 0.15, position: [0, 0, 6], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 3.5, -6], lookAt: [0, 1, -10] },
  ],
};

// About: a slow, near-straight forward push -- reads as "moving deeper in"
// while the bio panel holds screen-centre.
const ABOUT: RouteScene = {
  id: "about",
  variant: "about",
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, -6] },
    { at: 0.5, position: [0.6, -0.3, 2], lookAt: [0, 0, -10] },
    { at: 1, position: [0, -0.6, -8], lookAt: [0, -0.5, -18] },
  ],
};

// Experience: the camera travels down the timeline, banking right / left /
// right past each of the three section blocks.
const EXPERIENCE: RouteScene = {
  id: "experience",
  variant: "experience",
  keyframes: [
    { at: 0, position: [0, 1, 10], lookAt: [0, 0, 0] },
    { at: 0.34, position: [3.2, -2, 2], lookAt: [-1.5, -2.5, -6] },
    { at: 0.67, position: [-3.2, -6, -6], lookAt: [1.5, -6.5, -14] },
    { at: 1, position: [2.4, -11, -16], lookAt: [-1, -11.5, -24] },
  ],
};

// Contact: a short, gentle approach to a single panel that grows to fill
// centre as the (short) page bottoms out.
const CONTACT: RouteScene = {
  id: "contact",
  variant: "contact",
  keyframes: [
    { at: 0, position: [0, 0.4, 10], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 3], lookAt: [0, 0, -0.5] },
  ],
};

const DRIFT: RouteScene = { id: "drift", variant: "drift", keyframes: [] };

const REGISTRY: Record<string, RouteScene> = {
  "/": HOME,
  "/about": ABOUT,
  "/experience": EXPERIENCE,
  "/contact": CONTACT,
};

/** trailingSlash: true means usePathname() yields "/about/" for every
 * route except root -- strip it before lookup. */
export function getSceneForPath(pathname: string): RouteScene {
  const normalized =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return REGISTRY[normalized] ?? DRIFT;
}
