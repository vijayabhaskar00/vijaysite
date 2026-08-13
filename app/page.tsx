import Link from "next/link";
import { site, nav } from "@/content/site";
import { employment, credentials, education } from "@/content/experience";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";
import StatBand from "@/components/StatBand";
import Marquee from "@/components/Marquee";
import { linkClass } from "@/lib/ui";

export default function HomePage() {
  const exploreLinks = nav.filter((item) => item.href !== "/");
  const orgNames = Array.from(
    new Set([...employment, ...credentials, ...education].map((entry) => entry.org))
  );

  return (
    <>
      <section className="pb-10 pt-16 sm:pt-24 md:pb-16 md:pt-32">
        <p className="reveal font-mono text-xs uppercase tracking-[0.2em] text-amber">
          {site.location} — {site.tagline}
        </p>
        <h1 className="reveal [animation-delay:80ms] mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7.5rem)] font-black uppercase leading-[0.9] text-paper">
          {site.name}
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
        className="reveal [animation-delay:320ms] border-y border-line py-4 font-mono text-sm uppercase tracking-widest text-mute"
      />

      <StatBand />

      <SectionDivider />

      <nav aria-label="Explore" className="py-12 md:py-16">
        <ul className="flex list-none flex-wrap gap-x-10 gap-y-4 p-0 font-display text-2xl uppercase">
          {exploreLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
