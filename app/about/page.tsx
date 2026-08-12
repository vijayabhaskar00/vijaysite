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
    <section className="grid gap-10 py-14 sm:py-20 md:grid-cols-[minmax(0,240px)_1fr] md:items-start md:gap-16">
      <PhotoFrame
        src={site.photo.src}
        alt={site.photo.alt}
        width={site.photo.width}
        height={site.photo.height}
        loading="eager"
        className="mx-auto w-48 md:mx-0 md:w-full"
      />
      <div>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">About</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">{site.description}</p>
      </div>
    </section>
  );
}
