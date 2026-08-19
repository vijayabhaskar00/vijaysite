import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site, social } from "@/content/site";
import { linkClass, navLinkClass } from "@/lib/ui";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="max-w-2xl rounded-[2rem] bg-clay-lavender-light px-6 py-14 sm:py-20">
      <Reveal>
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          Contact
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          <SplitText text="Get in touch." />
        </h1>
        <p className="mt-8">
          <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
            {site.email}
          </a>
        </p>
      </Reveal>
      <Reveal delayMs={120}>
        <ul aria-label="Social links" className="mt-10 flex list-none flex-wrap gap-2 p-0 pt-8">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
