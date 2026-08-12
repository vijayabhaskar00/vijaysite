interface PhotoFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function PhotoFrame({ src, alt, width, height, className }: PhotoFrameProps) {
  return (
    <div className={`photo-frame ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} height={height} loading="lazy" />
    </div>
  );
}
