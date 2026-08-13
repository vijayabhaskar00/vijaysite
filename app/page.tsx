import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";
import StatBand from "@/components/StatBand";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import Flythrough from "@/components/motion/Flythrough";

export default function HomePage() {
  const hero = (
    <>
      <section className="pb-10 pt-16 sm:pt-24 md:pb-16 md:pt-32">
        <p className="reveal font-mono text-xs uppercase tracking-[0.2em] text-amber">
          {site.location} — {site.tagline}
        </p>
        <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7.5rem)] font-black uppercase leading-[0.9] text-paper">
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
        className="reveal [animation-delay:320ms] border-y border-line py-4 font-mono text-sm uppercase tracking-widest text-mute"
      />

      <Reveal>
        <StatBand />
      </Reveal>

      <Reveal className="py-14 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-mute">
          Affiliations &amp; credentials
        </p>
        <div className="mt-6">
          <OrgLogoGrid />
        </div>
      </Reveal>

      <SectionDivider />
    </>
  );

  return <Flythrough hero={hero} />;
}
