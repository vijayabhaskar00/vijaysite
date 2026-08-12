import Link from "next/link";
import { site, nav } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";
import Texture from "@/components/Texture";
import { linkClass } from "@/lib/ui";

export default function HomePage() {
  const exploreLinks = nav.filter((item) => item.href !== "/");

  return (
    <>
      <section className="relative grid gap-10 pb-16 pt-14 sm:pt-20 md:grid-cols-[minmax(0,220px)_1fr] md:items-center md:gap-16 md:pb-24 md:pt-28">
        <Texture className="pointer-events-none absolute -left-10 -top-10 -z-10 h-56 w-56 text-ochre/20 md:h-72 md:w-72" />
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
          loading="eager"
          className="relative mx-auto w-48 md:mx-0 md:w-full"
        />
        <div className="relative">
          <p className="font-display text-lg text-terracotta sm:text-xl">{site.tagline}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {site.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">{site.description}</p>
        </div>
      </section>

      <SectionDivider className="h-3 w-full text-terracotta/70 md:h-4" />

      <nav aria-label="Explore" className="py-12 md:py-16">
        <ul className="flex list-none flex-wrap gap-x-10 gap-y-4 p-0 font-display text-xl">
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
