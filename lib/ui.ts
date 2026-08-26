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
// prefers-reduced-motion, with zero JS involved either way. A function
// (not a plain string) so Header can request the permanently-filled
// `active` variant for the current page's nav pill without duplicating
// this whole class list -- every other caller keeps calling it with no
// argument, identical to the old constant's output.
export function navLinkClass(active = false): string {
  const state = active
    ? "text-surface"
    : "text-ink hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface";
  return `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-clay-raised transition-[background-color,color,transform] duration-300 motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 active:shadow-clay-pressed ${state} ${focusRingClass}`;
}

// A solid, always-filled clay-amber pill for the one primary action on a
// page (HomeHero's "Let's talk" CTA, the Contact page's mailto) --
// bigger than navLinkClass's nav/social pills since those are secondary
// wayfinding, not a call to action. Deliberately its own function rather
// than navLinkClass(true) at a larger text size: this variant keeps its
// filled state on its own permanently (no active-page toggle) and darkens
// rather than re-filling on hover, since it's already filled at rest.
export const primaryButtonClass = `inline-flex items-center gap-2 rounded-full bg-clay-amber px-6 py-3 text-base font-semibold text-surface shadow-clay-raised transition-[filter,transform] duration-300 hover:brightness-95 motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 active:shadow-clay-pressed ${focusRingClass}`;
