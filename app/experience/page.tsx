import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import SectionDivider from "@/components/SectionDivider";
import Reveal from "@/components/Reveal";
import OrgMark from "@/components/OrgMark";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history, education, and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

function Timeline({ title, entries }: { title: string; entries: TimelineEntry[] }) {
  return (
    <div>
      <h2 className="font-mono text-xs font-normal uppercase tracking-widest text-amber">
        {title}
      </h2>
      <ul className="mt-6 space-y-10 border-l border-line pl-6 sm:pl-8">
        {entries.map((entry) => (
          <li key={`${entry.org}-${entry.period}`} className="flex gap-4">
            <OrgMark org={entry.org} className="h-12 w-12 shrink-0" />
            <div>
              <span className="inline-block font-mono text-sm tabular-nums text-amber">
                {entry.period}
              </span>
              <h3 className="mt-1 font-display text-xl font-bold uppercase text-paper">
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

const sections: { title: string; entries: TimelineEntry[] }[] = [
  { title: "Employment", entries: employment },
  { title: "Education", entries: education },
  { title: "Credentials", entries: credentials },
];

export default function ExperiencePage() {
  return (
    <section className="py-14 sm:py-20">
      <h1 className="font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
        Experience
      </h1>
      {sections.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-12" : undefined}>
          {index > 0 && <SectionDivider className="my-14" />}
          <Reveal delayMs={index * 80}>
            <Timeline title={section.title} entries={section.entries} />
          </Reveal>
        </div>
      ))}
    </section>
  );
}
