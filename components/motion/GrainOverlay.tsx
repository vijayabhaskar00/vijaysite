/** A fixed, click-through film-grain texture over the whole page. Pure
 * CSS/SVG (see .grain-overlay in globals.css) -- no canvas, no per-frame JS.
 * The flicker animation is reduced-motion-gated there; the texture itself
 * stays visible either way. */
export default function GrainOverlay() {
  return <div aria-hidden="true" className="grain-overlay" />;
}
