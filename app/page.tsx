import Link from "next/link";
import { site, nav } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";
import Texture from "@/components/Texture";
import StatBand from "@/components/StatBand";
import { linkClass } from "@/lib/ui";

export default function HomePage() {
  const exploreLinks = nav.filter((item) => item.href !== "/");

  return (
    <>
      <section className="relative grid gap-10 pb-16 pt-16 sm:pt-24 md:grid-cols-[minmax(0,260px)_1fr] md:items-center md:gap-16 md:pb-24 md:pt-32">
        <Texture className="pointer-events-none absolute -left-14 -top-14 -z-10 h-64 w-64 text-ochre/25 md:h-80 md:w-80" />
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
          loading="eager"
          className="reveal relative mx-auto w-52 md:mx-0 md:w-full"
        />
        <div className="relative">
          <p className="reveal [animation-delay:80ms] font-display text-lg italic text-terracotta sm:text-xl">
            {site.tagline}
          </p>
          <h1 className="reveal [animation-delay:160ms] mt-3 text-balance font-display text-5xl leading-[1.05] text-ink sm:text-6xl md:text-7xl">
            {site.name}
          </h1>
          <p className="reveal [animation-delay:240ms] mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
            {site.description}
          </p>
        </div>
      </section>

      <StatBand />

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
