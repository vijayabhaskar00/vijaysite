import type { Metadata } from "next";
import Script from "next/script";
import { baloo2, nunito } from "@/lib/fonts";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { themeBootstrapScript } from "@/lib/themeBootstrap";
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
        {/* Sets data-theme on <html> before first paint, from a stored
            choice or (failing that) the OS preference -- beforeInteractive
            inlines and runs this ahead of hydration, so there is no
            flash of the wrong theme. See lib/theme.ts for the shared
            source of this logic and useTheme(), which reads the result. */}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript()}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <a
          href="#main-content"
          className="sr-only rounded-full bg-clay-amber px-4 py-2 text-sm font-semibold text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
