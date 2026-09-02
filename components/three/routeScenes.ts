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

// Placeholder paths -- tuned against the real scenes in Plan 2.
const ABOUT: RouteScene = {
  id: "about",
  variant: "about",
  keyframes: [
    { at: 0, position: [0, 0, 8], lookAt: [0, 0, -4] },
    { at: 1, position: [0, 0, -6], lookAt: [0, 0, -14] },
  ],
};

const EXPERIENCE: RouteScene = {
  id: "experience",
  variant: "experience",
  keyframes: [
    { at: 0, position: [0, 0, 8], lookAt: [0, 0, 0] },
    { at: 0.5, position: [2, -3, -6], lookAt: [-1, -3, -10] },
    { at: 1, position: [-2, -8, -18], lookAt: [1, -8, -24] },
  ],
};

const CONTACT: RouteScene = {
  id: "contact",
  variant: "contact",
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 3.5], lookAt: [0, 0, 0] },
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
