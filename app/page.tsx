import Link from "next/link";
import { site, social } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import HomeHero from "@/components/HomeHero";
import StatBand from "@/components/StatBand";
import Reveal from "@/components/Reveal";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import PhotoFrame from "@/components/PhotoFrame";
import Tilt from "@/components/motion/Tilt";
import Magnetic from "@/components/motion/Magnetic";
import AmbientColorDrift from "@/components/motion/AmbientColorDrift";
import { linkClass, navLinkClass, primaryButtonClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: TimelineEntry[] = [employment[0], credentials[0], education[0]];

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
      <AmbientColorDrift />
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
        <div className="grid gap-10 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-12">
          <Tilt>
            <PhotoFrame
              src={site.photo.src}
              alt={site.photo.alt}
              width={site.photo.width}
              height={site.photo.height}
              className="mx-auto h-32 w-32 sm:mx-0"
            />
          </Tilt>
          <div>
            <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
              01 · About
            </p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
              {site.tagline}
            </h2>
            <p className="mt-6 max-w-xl rounded-[1.5rem] bg-surface px-6 py-5 text-lg leading-relaxed text-ink shadow-clay-raised">
              {site.description}
            </p>
            <ArrowLink href="/about">View full profile</ArrowLink>
          </div>
        </div>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-teal-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-teal">
          02 · Experience
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">A working history.</h2>
        <div className="relative mt-8 max-w-xl">
          <div aria-hidden="true" className="pointer-events-none absolute bottom-1 left-[19px] top-1 w-px bg-ink/10" />
          <ol className="space-y-6">
            {EXPERIENCE_HIGHLIGHTS.map((entry) => (
              <li key={`${entry.org}-${entry.period}`} className="relative flex items-start gap-4 pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-3 top-2 h-3 w-3 rounded-full bg-clay-teal ring-4 ring-clay-teal-light"
                />
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
        </div>
        <ArrowLink href="/experience">View full timeline</ArrowLink>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-lavender-light px-6 py-14 text-center sm:py-20">
        <Tilt className="mx-auto inline-block">
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            className="mx-auto h-24 w-24"
          />
        </Tilt>
        <p className="mt-6 inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          03 · Contact
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch.</h2>
        <p className="mt-6">
          <Magnetic>
            <a href={`mailto:${site.email}`} className={primaryButtonClass}>
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
