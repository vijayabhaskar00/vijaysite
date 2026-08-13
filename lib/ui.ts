// Shared Tailwind utility strings, kept here so link styling stays
// consistent across Header, Footer, and page-level links without
// duplicating the same class list by hand in every file.
export const linkClass =
  "text-teal underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded-sm";

// Same focus-visible ring discipline as linkClass, styled for the
// mono/uppercase wayfinding links (primary nav, footer/contact social
// links) instead of the teal-underline body-link treatment.
export const navLinkClass =
  "text-ink/70 transition-colors hover:text-terracotta focus-visible:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded-sm";
