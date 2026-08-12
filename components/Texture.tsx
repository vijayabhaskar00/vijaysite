export default function Texture({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width="100%" height="100%">
      <defs>
        <pattern id="ikat-weave" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 12 L12 0 L24 12 L12 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ikat-weave)" />
    </svg>
  );
}
