/** Derives a 1-2 letter mark from an org name for orgs with no logo file.
 * Multi-word names use the initials of the first two significant words
 * (e.g. "Mahatma Gandhi Institute of Technology" -> "MG"); single-word
 * names use their first two letters (e.g. "stuMagz" -> "ST"). */
export function monogramFor(org: string): string {
  const words = org
    .split(/[\s,–—-]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
