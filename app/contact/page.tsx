import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site, social } from "@/content/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section>
      <h1 className="font-display">Contact</h1>
      <p>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      <ul aria-label="Social links">
        {social.map((item) => (
          <li key={item.href}>
            <a href={item.href} target="_blank" rel="noreferrer noopener">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
