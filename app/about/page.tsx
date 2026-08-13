import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: site.description,
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="grid gap-10 py-14 sm:py-20 md:grid-cols-[minmax(0,200px)_1fr] md:items-start md:gap-16">
      <PhotoFrame
        src={site.photo.src}
        alt={site.photo.alt}
        width={site.photo.width}
        height={site.photo.height}
        loading="eager"
        className="mx-auto h-40 w-40 md:mx-0 md:h-full md:w-full"
      />
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-amber">About</p>
        <h1 className="mt-2 text-balance font-display text-4xl uppercase leading-tight text-paper sm:text-5xl">
          Entrepreneur, mentor, and product designer.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mute">{site.description}</p>
        <p className="mt-6 max-w-2xl border-l-2 border-amber/40 pl-6 text-xl leading-relaxed text-paper/90">
          &ldquo;{site.tagline}&rdquo; &mdash; based in {site.location}, working across education,
          innovation mentorship, and product design.
        </p>
      </div>
    </section>
  );
}
