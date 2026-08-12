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
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Contact</h1>
      <p className="mt-6">
        <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
          {site.email}
        </a>
      </p>
      <ul aria-label="Social links" className="mt-8 flex list-none gap-x-8 p-0">
        {social.map((item) => (
          <li key={item.href}>
            <a href={item.href} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
