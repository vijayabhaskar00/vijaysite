// Shared Tailwind utility strings, kept here so link styling stays
// consistent across Header, Footer, and page-level links without
// duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 rounded-sm";

export const linkClass = `text-signal underline-offset-4 hover:underline focus-visible:underline ${focusRingClass}`;

// Same focus-visible ring discipline as linkClass, styled for the
// mono/uppercase wayfinding links (primary nav, footer/contact social
// links) instead of the signal-underline body-link treatment.
export const navLinkClass = `text-mute transition-colors hover:text-amber focus-visible:text-amber ${focusRingClass}`;
