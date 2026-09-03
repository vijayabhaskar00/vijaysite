interface SunMarkProps {
  className?: string;
}

/** The site mark: "Bhaskar" means *sun* in Sanskrit, drawn in the site's
 * own clay language -- a soft terracotta disc with a cream light-catch and
 * a few stubby, asymmetric rounded rays, so it reads as both a sun and one
 * of the floating clay blobs you fly past in the 3D scene. Purely
 * decorative wherever it sits next to the "Vijaya Bhaskar" wordmark, so it
 * is aria-hidden; the accessible name comes from the adjacent text. Colors
 * are literal clay-palette hex (not tokens) so the file is self-contained
 * and works unchanged as app/icon.svg. */
export default function SunMark({ className }: SunMarkProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      {/* stubby rounded rays, asymmetric, fanning up and to the left */}
      <g stroke="#E2701F" strokeWidth="3.4" strokeLinecap="round">
        <line x1="7" y1="21.5" x2="2.4" y2="21.5" />
        <line x1="8.8" y1="13.4" x2="4.7" y2="9.3" />
        <line x1="15.4" y1="8" x2="13" y2="3" />
        <line x1="9.6" y1="28.6" x2="5.6" y2="31.4" />
      </g>
      {/* the clay disc */}
      <circle cx="22" cy="21" r="11" fill="#E2701F" />
      {/* cream light-catch: a soft crescent scooped from the upper-right */}
      <circle cx="28.5" cy="14" r="7" fill="#FBF3E7" />
    </svg>
  );
}
