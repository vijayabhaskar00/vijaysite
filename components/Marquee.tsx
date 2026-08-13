interface MarqueeProps {
  items: string[];
  className?: string;
}

/** A slow, looping horizontal ticker. See app/globals.css for the
 * animation and its reduced-motion fallback. */
export default function Marquee({ items, className }: MarqueeProps) {
  const text = items.join("   •   ");
  return (
    <div aria-hidden="true" className={["overflow-hidden", className].filter(Boolean).join(" ")}>
      <div className="marquee-track">
        <span className="marquee-copy-1 shrink-0 whitespace-nowrap pr-10">{text}</span>
        <span className="marquee-copy-2 shrink-0 whitespace-nowrap pr-10">{text}</span>
      </div>
    </div>
  );
}
