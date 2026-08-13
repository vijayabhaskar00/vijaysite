import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site, social } from "@/content/site";
import { linkClass } from "@/lib/ui";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="max-w-2xl py-14 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-terracotta">Contact</p>
      <h1 className="mt-2 text-balance font-display text-4xl text-ink sm:text-5xl">
        Get in touch.
      </h1>
      <p className="mt-8">
        <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
          {site.email}
        </a>
      </p>
      <ul
        aria-label="Social links"
        className="mt-10 flex list-none flex-wrap gap-x-8 gap-y-3 border-t border-ink/10 p-0 pt-8 font-mono text-xs uppercase tracking-widest"
      >
        {social.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-ink/70 transition-colors hover:text-terracotta focus-visible:text-terracotta focus-visible:underline focus-visible:outline-none"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
