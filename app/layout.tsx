import type { Metadata } from "next";
import { baloo2, nunito } from "@/lib/fonts";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
