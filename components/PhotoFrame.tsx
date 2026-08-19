import { resolveAssetPath } from "@/lib/assetPath";

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
  const frameClassName = ["photo-frame", "rounded-[2rem] shadow-clay-raised", className]
    .filter(Boolean)
    .join(" ");
  const resolvedSrc = resolveAssetPath(src);
  return (
    <div className={frameClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolvedSrc} alt={alt} width={width} height={height} loading={loading} />
    </div>
  );
}
