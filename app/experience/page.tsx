import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import SectionDivider from "@/components/SectionDivider";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history, education, and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

function Timeline({ title, entries }: { title: string; entries: TimelineEntry[] }) {
  return (
    <div>
      <h2 className="font-mono text-xs font-normal uppercase tracking-widest text-terracotta">
        {title}
      </h2>
      <ul className="mt-6 space-y-10 border-l-2 border-terracotta/25 pl-6 sm:pl-8">
        {entries.map((entry) => (
          <li key={`${entry.org}-${entry.period}`}>
            <span className="inline-block rounded-full bg-ochre/15 px-3 py-1 text-sm font-medium tabular-nums text-ochre">
              {entry.period}
            </span>
            <h3 className="mt-3 font-display text-xl text-ink">
              {entry.role} · {entry.org}
            </h3>
            <p className="mt-2 max-w-2xl text-ink/80">{entry.description}</p>
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
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Experience</h1>
      {sections.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-12" : undefined}>
          {index > 0 && <SectionDivider className="my-14 h-3 w-full text-ochre/60 md:h-4" />}
          <Timeline title={section.title} entries={section.entries} />
        </div>
      ))}
    </section>
  );
}
