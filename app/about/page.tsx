import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";
import Tilt from "@/components/motion/Tilt";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: site.description,
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="grid gap-10 rounded-[2rem] bg-clay-pink-light px-6 py-14 sm:py-20 md:grid-cols-[minmax(0,200px)_1fr] md:items-start md:gap-16">
      <Reveal>
        <Tilt>
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            loading="eager"
            className="mx-auto h-40 w-40 md:mx-0 md:h-48 md:w-48"
          />
        </Tilt>
      </Reveal>
      <Reveal delayMs={120}>
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
          About
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          <SplitText text="Entrepreneur, mentor, and product designer." staggerMs={10} />
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/80">{site.description}</p>
        <p className="mt-6 max-w-2xl rounded-[1.5rem] bg-surface px-6 py-5 text-xl leading-relaxed text-ink shadow-clay-raised">
          &ldquo;{site.tagline}&rdquo; &mdash; based in {site.location}, working across education,
          innovation mentorship, and product design.
        </p>
      </Reveal>
    </section>
  );
}
