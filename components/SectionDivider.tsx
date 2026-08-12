export default function SectionDivider({ className }: { className?: string }) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 200 12"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M0 6 C 20 0, 40 12, 60 6 S 100 0, 120 6 S 160 12, 180 6 S 200 0, 200 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
