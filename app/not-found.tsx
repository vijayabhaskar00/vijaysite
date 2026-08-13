import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { linkClass } from "@/lib/ui";

// Deliberately not using buildMetadata()'s canonical/OG wiring here — a 404
// response shouldn't declare a canonical URL for itself. It still renders
// inside the shared app/layout.tsx, so it keeps the real Header/Footer,
// fonts, and palette rather than falling back to Next's bare default page.
export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <section className="py-24 text-center sm:py-32">
      <p className="font-mono text-sm uppercase tracking-widest text-amber">404</p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-mute">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link href="/" className={`mt-8 inline-block text-lg ${linkClass}`}>
        Back to home
      </Link>
    </section>
  );
}
