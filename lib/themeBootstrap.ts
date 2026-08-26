// Pulled out of lib/theme.ts into its own module deliberately: this is a
// plain string-returning function with no React import, so it's safe for
// app/layout.tsx (a Server Component) to import directly for its
// beforeInteractive <Script>. lib/theme.ts also exports useTheme(), which
// uses useState/useEffect -- if this lived there too, importing it from a
// Server Component would pull those hooks into server compilation and
// Next.js refuses the build ("You're importing a component that needs
// useEffect... none of its parents are marked with 'use client'").

export const THEME_STORAGE_KEY = "theme";

/** The exact bootstrap logic every render path needs to agree on: prefer
 * a stored choice, otherwise follow the OS preference. This is inlined as
 * pre-hydration `<script>` source in app/layout.tsx, so it's kept as one
 * string template rather than a function lib/theme.ts's useTheme() could
 * just call at runtime. */
export function themeBootstrapScript(): string {
  return `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
}
