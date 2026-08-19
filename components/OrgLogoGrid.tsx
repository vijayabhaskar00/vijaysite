import { orgNames } from "@/content/site";
import OrgMark from "@/components/OrgMark";

export default function OrgLogoGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {orgNames.map((org) => (
        <div
          key={org}
          className="flex flex-col items-center rounded-[2rem] bg-surface p-5 text-center shadow-clay-raised transition-transform duration-300 motion-safe:hover:-translate-y-1"
        >
          <OrgMark org={org} className="h-16 w-16" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">{org}</p>
        </div>
      ))}
    </div>
  );
}
