import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import Reveal from "@/components/Reveal";
import OrgMark from "@/components/OrgMark";
import SplitText from "@/components/SplitText";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history, education, and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

const SECTION_ACCENTS = {
  Employment: { badgeBg: "bg-clay-teal-light", badgeText: "text-clay-teal", pillBg: "bg-clay-teal-light", pillText: "text-clay-teal" },
  Education: { badgeBg: "bg-clay-lavender-light", badgeText: "text-clay-lavender", pillBg: "bg-clay-lavender-light", pillText: "text-clay-lavender" },
  Credentials: { badgeBg: "bg-clay-pink-light", badgeText: "text-clay-pink", pillBg: "bg-clay-pink-light", pillText: "text-clay-pink" },
} as const;

function Timeline({
  title,
  entries,
}: {
  title: keyof typeof SECTION_ACCENTS;
  entries: TimelineEntry[];
}) {
  const accent = SECTION_ACCENTS[title];
  return (
    <div>
      <h2
        className={`inline-block rounded-full ${accent.badgeBg} px-4 py-1 text-xs font-semibold uppercase tracking-wide ${accent.badgeText}`}
      >
        {title}
      </h2>
      <ul className="mt-6 space-y-4">
        {entries.map((entry) => (
          <li
            key={`${entry.org}-${entry.period}`}
            className="flex gap-4 rounded-[2rem] bg-surface p-5 shadow-clay-raised sm:p-6"
          >
            <OrgMark org={entry.org} className="h-12 w-12 shrink-0" />
            <div>
              <span
                className={`inline-block rounded-full ${accent.pillBg} px-3 py-0.5 text-xs font-semibold tabular-nums ${accent.pillText}`}
              >
                {entry.period}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-ink">
                {entry.role} · {entry.org}
              </h3>
              <p className="mt-2 max-w-2xl text-mute">{entry.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const sections: { title: keyof typeof SECTION_ACCENTS; entries: TimelineEntry[] }[] = [
  { title: "Employment", entries: employment },
  { title: "Education", entries: education },
  { title: "Credentials", entries: credentials },
];

export default function ExperiencePage() {
  return (
    <section className="py-14 sm:py-20">
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
        <SplitText text="Experience" />
      </h1>
      {sections.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-12" : "mt-16"}>
          <Reveal delayMs={index * 80}>
            <Timeline title={section.title} entries={section.entries} />
          </Reveal>
        </div>
      ))}
    </section>
  );
}
