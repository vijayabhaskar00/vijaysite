// Shared Tailwind utility strings for clay pill-styled links, kept here so
// styling stays consistent across Header, Footer, and page-level links
// without duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40";

// link-sweep (globals.css) draws an animated underline on hover/focus for
// inline body-text links (mailto, "View full profile"-style CTAs).
export const linkClass = `link-sweep font-semibold text-clay-amber rounded-sm ${focusRingClass}`;

// Pill-shaped nav/social links: fills with the site's primary accent on
// hover/focus and presses in on click, replacing the old underline-sweep +
// mono-uppercase treatment.
export const navLinkClass = `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-ink shadow-clay-raised transition-colors duration-300 hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface active:shadow-clay-pressed ${focusRingClass}`;
