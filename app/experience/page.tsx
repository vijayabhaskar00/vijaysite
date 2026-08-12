import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, type TimelineEntry } from "@/content/experience";
import SectionDivider from "@/components/SectionDivider";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

function Timeline({ title, entries }: { title: string; entries: TimelineEntry[] }) {
  return (
    <div>
      <h2 className="font-display">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={`${entry.org}-${entry.period}`}>
            <span>{entry.period}</span>
            <h3>
              {entry.role} · {entry.org}
            </h3>
            <p>{entry.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExperiencePage() {
  return (
    <section>
      <h1 className="font-display">Experience</h1>
      <Timeline title="Employment" entries={employment} />
      <SectionDivider />
      <Timeline title="Credentials" entries={credentials} />
    </section>
  );
}
