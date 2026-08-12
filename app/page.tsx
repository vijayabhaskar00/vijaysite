import Link from "next/link";
import { site } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
        />
        <h1 className="font-display">{site.name}</h1>
        <p>{site.tagline}</p>
        <p>{site.description}</p>
      </section>
      <SectionDivider />
      <nav aria-label="Explore">
        <Link href="/about">About</Link>
        <Link href="/experience">Experience</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </>
  );
}
