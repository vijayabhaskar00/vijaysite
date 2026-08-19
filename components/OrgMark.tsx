import { orgLogos } from "@/content/orgLogos";
import { resolveAssetPath } from "@/lib/assetPath";
import { monogramFor } from "@/lib/monogram";

interface OrgMarkProps {
  org: string;
  className?: string;
}

/** A square mark representing an organization: its real logo when one is
 * available in content/orgLogos.ts, otherwise a generated monogram. The org
 * name itself is rendered as visible text by the caller (OrgLogoGrid /
 * experience timeline), so the mark itself can stay decorative. */
export default function OrgMark({ org, className }: OrgMarkProps) {
  const src = orgLogos[org];
  const classes = ["flex items-center justify-center", className].filter(Boolean).join(" ");

  if (src) {
    return (
      <div className={classes}>
        <img
          src={resolveAssetPath(src)}
          alt={`${org} logo`}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={classes} aria-hidden="true">
      <span className="font-display text-2xl font-extrabold text-mute">{monogramFor(org)}</span>
    </div>
  );
}
