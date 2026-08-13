export default function SectionDivider({ className }: { className?: string }) {
  return <hr className={`border-line ${className ?? ""}`} />;
}
