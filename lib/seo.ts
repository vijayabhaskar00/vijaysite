import type { Metadata } from "next";
import { site, social } from "@/content/site";

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
}

export function buildMetadata({ title, description, path }: PageSeoInput): Metadata {
  const url = new URL(path, site.baseUrl).toString();
  const fullTitle = `${title} | ${site.name}`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: new URL("/og-image.png", site.baseUrl).toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [new URL("/og-image.png", site.baseUrl).toString()],
    },
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.baseUrl,
    jobTitle: site.jobTitle,
    worksFor: {
      "@type": "Organization",
      name: "stuMagz",
    },
    sameAs: social.map((s) => s.href),
  } as {
    "@context": string;
    "@type": string;
    name: string;
    url: string;
    jobTitle: string;
    worksFor: { "@type": string; name: string };
    sameAs: string[];
  };
}
