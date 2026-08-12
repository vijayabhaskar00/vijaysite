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
    <section>
      <h1 className="font-display">About</h1>
      <PhotoFrame
        src={site.photo.src}
        alt={site.photo.alt}
        width={site.photo.width}
        height={site.photo.height}
      />
      <p>{site.description}</p>
    </section>
  );
}
