import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site, social } from "@/content/site";
import { navLinkClass, primaryButtonClass } from "@/lib/ui";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";
import PhotoFrame from "@/components/PhotoFrame";
import Magnetic from "@/components/motion/Magnetic";
import Tilt from "@/components/motion/Tilt";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="max-w-2xl rounded-[2rem] bg-clay-lavender-light px-6 py-14 sm:py-20">
      <Reveal>
        <div className="grid gap-8 sm:grid-cols-[minmax(0,120px)_1fr] sm:items-center">
          <Tilt>
            <PhotoFrame
              src={site.photo.src}
              alt={site.photo.alt}
              width={site.photo.width}
              height={site.photo.height}
              className="mx-auto h-28 w-28 sm:mx-0"
            />
          </Tilt>
          <div>
            <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
              Contact
            </p>
            <h1 className="mt-2 text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
              <SplitText text="Get in touch." />
            </h1>
            <p className="mt-6">
              <Magnetic>
                <a href={`mailto:${site.email}`} className={primaryButtonClass}>
                  {site.email}
                </a>
              </Magnetic>
            </p>
          </div>
        </div>
      </Reveal>
      <Reveal delayMs={120}>
        <ul aria-label="Social links" className="mt-10 flex list-none flex-wrap gap-2 p-0 pt-8">
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
      </Reveal>
    </section>
  );
}
