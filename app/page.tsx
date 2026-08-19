import Link from "next/link";
import { site, social, orgNames } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import PhotoFrame from "@/components/PhotoFrame";
import StatBand from "@/components/StatBand";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import { linkClass, navLinkClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];

/** Two overlapping soft blobs behind the hero portrait — the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. */
function ClayBlobBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 opacity-90 sm:-right-14 sm:-top-14 sm:h-48 sm:w-48 lg:-right-16 lg:-top-16 lg:h-56 lg:w-56"
    >
      <path
        fill="#FBE0C4"
        d="M281,305Q246,360,183,347Q120,334,88,281Q56,228,80,169Q104,110,163,86Q222,62,272,101Q322,140,323,199Q324,258,281,305Z"
      />
      <path
        fill="#FBE1E9"
        opacity="0.8"
        d="M255,120Q270,180,235,220Q200,260,150,245Q100,230,90,175Q80,120,125,90Q170,60,215,80Q260,100,255,120Z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <section className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32">
        <ClayBlobBackdrop />
        <p className="reveal inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          {site.location} — {site.tagline}
        </p>
        <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
          <SplitText text={site.name} baseDelayMs={80} staggerMs={18} />
        </h1>
        <div className="reveal [animation-delay:200ms] mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            loading="eager"
            className="h-28 w-28 shrink-0 md:h-32 md:w-32"
          />
        </div>
      </section>

      <Marquee
        items={orgNames}
        className="reveal [animation-delay:320ms] rounded-full bg-surface py-4 text-sm font-semibold text-mute shadow-clay-raised"
      />

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
        <Link href="/about" className={`mt-6 inline-block ${linkClass}`}>
          View full profile →
        </Link>
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
        <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
          View full timeline →
        </Link>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-lavender-light px-6 py-14 text-center sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          Contact
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch.</h2>
        <p className="mt-6">
          <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
            {site.email}
          </a>
        </p>
        <ul aria-label="Social links" className="mt-6 flex list-none flex-wrap justify-center gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/contact" className={`mt-6 inline-block ${linkClass}`}>
          View full contact →
        </Link>
      </Reveal>
    </div>
  );
}
