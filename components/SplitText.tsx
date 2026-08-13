interface SplitTextProps {
  text: string;
  className?: string;
  /** Delay before the first character starts, in ms. */
  baseDelayMs?: number;
  /** Delay added per subsequent character, in ms. */
  staggerMs?: number;
}

/** Splits text into per-character spans that stagger in on load (pure CSS,
 * see .split-char in globals.css -- same "visible unless motion is allowed
 * AND the animation is defined" pattern as .reveal, so this is safe with no
 * JS and reads correctly to crawlers). The real string stays in the DOM via
 * aria-label on the wrapper; individual character spans are aria-hidden so
 * screen readers get one clean word, not a letter-by-letter spelling-out. */
export default function SplitText({ text, className, baseDelayMs = 0, staggerMs = 18 }: SplitTextProps) {
  const chars = Array.from(text);
  return (
    <span className={className} aria-label={text}>
      {chars.map((char, index) =>
        /\s/.test(char) ? (
          <span key={index} aria-hidden="true">
            {char}
          </span>
        ) : (
          <span
            key={index}
            aria-hidden="true"
            className="split-char"
            style={{ animationDelay: `${baseDelayMs + index * staggerMs}ms` }}
          >
            {char}
          </span>
        )
      )}
    </span>
  );
}
