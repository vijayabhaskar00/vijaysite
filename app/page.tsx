import Link from "next/link";
import { site, social } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import HomeHero from "@/components/HomeHero";
import StatBand from "@/components/StatBand";
import Reveal from "@/components/Reveal";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import Magnetic from "@/components/motion/Magnetic";
import { linkClass, navLinkClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];

function ArrowLink({ href, children }: { href: string; children: string }) {
  return (
    <Magnetic className="mt-6">
      <Link href={href} className={linkClass}>
        {children}{" "}
        <span className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">
          →
        </span>
      </Link>
    </Magnetic>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <HomeHero />

      <Reveal>
        <StatBand />
      </Reveal>

      <Reveal>
        <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          Affiliations &amp; credentials
        </p>
        <div className="mt-6">
          <OrgLogoGrid />
        </div>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-pink-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
          About
        </p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          {site.tagline}
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">{site.description}</p>
        <ArrowLink href="/about">View full profile</ArrowLink>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-teal-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-teal">
          Experience
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">A working history.</h2>
        <ol className="mt-8 max-w-xl space-y-6">
          {EXPERIENCE_HIGHLIGHTS.map((entry) => (
            <li key={`${entry.org}-${entry.period}`} className="flex items-start gap-4">
              <span className="mt-1 shrink-0 text-sm font-bold tabular-nums text-clay-teal">{entry.number}</span>
              <OrgMark org={entry.org} className="h-10 w-10 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-ink">
                  {entry.role} · {entry.org}
                </p>
                <p className="mt-1 text-sm text-ink/70">{entry.period}</p>
              </div>
            </li>
          ))}
        </ol>
        <ArrowLink href="/experience">View full timeline</ArrowLink>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-lavender-light px-6 py-14 text-center sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          Contact
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch.</h2>
        <p className="mt-6">
          <Magnetic>
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </Magnetic>
        </p>
        <ul aria-label="Social links" className="mt-6 flex list-none flex-wrap justify-center gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <Magnetic>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                  {item.label}
                </a>
              </Magnetic>
            </li>
          ))}
        </ul>
        <ArrowLink href="/contact">View full contact</ArrowLink>
      </Reveal>
    </div>
  );
}
