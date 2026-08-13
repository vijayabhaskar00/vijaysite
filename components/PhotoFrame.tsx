interface PhotoFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** LCP-critical hero usages (Home, About) should pass "eager". Defaults to "lazy". */
  loading?: "eager" | "lazy";
}

export default function PhotoFrame({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
}: PhotoFrameProps) {
  const frameClassName = ["photo-frame", className].filter(Boolean).join(" ");
  // Root-relative sources need the basePath prefix that next/image and
  // next/link get automatically; absolute URLs (e.g. in tests) pass through.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const resolvedSrc = src.startsWith("/") ? `${basePath}${src}` : src;
  return (
    <div className={frameClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolvedSrc} alt={alt} width={width} height={height} loading={loading} />
    </div>
  );
}
