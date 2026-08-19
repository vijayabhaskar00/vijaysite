// Shared Tailwind utility strings for clay pill-styled links, kept here so
// styling stays consistent across Header, Footer, and page-level links
// without duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40";

// link-sweep (globals.css) draws an animated underline on hover/focus for
// inline body-text links (mailto, "View full profile"-style CTAs). `group`
// lets an arrow glyph nested inside react to group-hover (see app/page.tsx).
export const linkClass = `link-sweep group font-semibold text-clay-amber rounded-sm ${focusRingClass}`;

// Pill-shaped nav/social links: fills with the site's primary accent and
// scales up slightly on hover/focus, presses back down on click --
// motion-safe: means this stays purely a color change under
// prefers-reduced-motion, with zero JS involved either way.
export const navLinkClass = `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-ink shadow-clay-raised transition-[background-color,color,transform] duration-300 hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 active:shadow-clay-pressed ${focusRingClass}`;
