/** Prefixes a root-relative asset path with the GitHub Pages basePath.
 * Absolute URLs (http(s)://...) pass through untouched. next/image and
 * next/link get this automatically from Next's basePath config; anything
 * rendering a raw <img>/<div style="background-image"> src needs it applied
 * manually. */
export function resolveAssetPath(src: string): string {
  if (!src.startsWith("/")) return src;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${src}`;
}
