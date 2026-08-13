// Shared Tailwind utility strings, kept here so link styling stays
// consistent across Header, Footer, and page-level links without
// duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 rounded-sm";

// link-sweep (globals.css) draws an animated underline on hover/focus
// instead of toggling text-decoration, so the reveal can ease in and out.
export const linkClass = `link-sweep text-signal ${focusRingClass}`;

// Same focus-ring and underline-sweep mechanics as linkClass, styled for
// the mono/uppercase wayfinding links (primary nav, footer/contact social
// links) with a color shift layered on top instead of the signal hue.
export const navLinkClass = `link-sweep text-mute transition-colors hover:text-amber focus-visible:text-amber ${focusRingClass}`;
