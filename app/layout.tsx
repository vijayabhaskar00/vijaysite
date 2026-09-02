import type { Metadata } from "next";
import { baloo2, nunito } from "@/lib/fonts";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { SceneProvider } from "@/lib/scene";
import SceneLayer from "@/components/three/SceneLayer";
import ScrollProgressBar from "@/components/motion/ScrollProgressBar";
import "./globals.css";

export const metadata: Metadata = buildMetadata({
  title: site.tagline,
  description: site.description,
  path: "/",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo2.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream font-body text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <SceneProvider>
          <SmoothScroll />
          <SceneLayer />
          <ScrollProgressBar />
          <a
            href="#main-content"
            className="sr-only rounded-full bg-clay-amber px-4 py-2 text-sm font-semibold text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">
            {children}
          </main>
          <Footer />
        </SceneProvider>
      </body>
    </html>
  );
}
