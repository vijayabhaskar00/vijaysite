# vijayabhaskar.in Personal Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unedited Blogger template at vijayabhaskar.in with a fast, SEO-strong, static Next.js site containing only verified real content, deployed to GitHub Pages on the existing custom domain.

**Architecture:** Next.js 14 (App Router, TypeScript) built as a fully static export (`output: 'export'`). Content lives in typed local modules under `content/`, not a CMS. Styling is Tailwind CSS driven by a custom token layer (not Tailwind defaults) implementing the "Warm Regional Identity" visual system. Deployed via GitHub Actions to GitHub Pages.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, `next/font/google` (self-hosted Fraunces + Public Sans), Vitest + @testing-library/react for tests, GitHub Actions (`actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-08-13-personal-site-design.md`

## Global Constraints

- Framework: Next.js 14 App Router + TypeScript, static export only
  (`output: 'export'` in `next.config.mjs`) — no server-only APIs, no API
  routes, no `cookies()`/`headers()` usage anywhere.
- Path alias: `@/*` maps to the project root (configured in `tsconfig.json`).
- Domain: `https://vijayabhaskar.in` — the `public/CNAME` file must contain
  exactly `vijayabhaskar.in` (no `www`, no protocol).
- Verified facts only. Allowed employer/credential names: stuMagz,
  Tsearch.in, ATAL Innovation Mission (Niti Aayog – GOI), Microsoft
  (SharePoint). Never invent achievements, book titles, or stats.
- Forbidden strings — must never appear in any shipped page: `XXXXX`,
  `href="#"`, `Google+`, `Punctual`, `Often people default`,
  `Born in India - Proud Indian`.
- Social links: only Instagram (`https://www.instagram.com/vijayabhaskarjatoth/`)
  and Facebook (`https://www.facebook.com/vijayabhaskarofficial`). No
  Twitter/X, LinkedIn, Behance, YouTube, or Google+ links.
- Contact: `mailto:me@vijayabhaskar.in` only — no working contact form, no
  phone number or DOB published.
- Palette tokens: background `#FBF3E7`, text `#2B211A`, accent/terracotta
  `#C1512D`, ochre `#B3792C`, link/teal `#1F5C56`.
- Fonts: Fraunces (display) + Public Sans (body), loaded via
  `next/font/google` (self-hosted at build time, no runtime CDN request).
- Testing: Vitest + `@testing-library/react` (jsdom environment) for unit
  and component tests; `npm run build` plus `scripts/verify-export.mjs` for
  static-output regression checks against the Global Constraints above.

---

## File Structure

```
package.json, tsconfig.json, next.config.mjs, tailwind.config.ts,
postcss.config.mjs, vitest.config.ts, .gitignore
public/
  CNAME
content/
  site.ts            — site metadata, nav, social links
  experience.ts       — employment + credentials timeline data
  __tests__/content.test.ts
lib/
  fonts.ts            — next/font/google exports
  seo.ts              — buildMetadata() + personJsonLd()
  __tests__/seo.test.ts
components/
  SectionDivider.tsx
  Texture.tsx
  PhotoFrame.tsx
  Header.tsx
  Footer.tsx
  __tests__/*.test.tsx
app/
  layout.tsx
  globals.css
  page.tsx            — Home
  about/page.tsx
  experience/page.tsx
  contact/page.tsx
  sitemap.ts
  robots.ts
  opengraph-image.tsx
scripts/
  verify-export.mjs
.github/workflows/deploy.yml
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Interfaces:**
- Produces: a working `npm run build` static export pipeline every later
  task builds on. Path alias `@/*` → project root.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "vijayabhaskar-site",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "verify:export": "node scripts/verify-export.mjs"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, lockfile written, no errors.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 5: Create `postcss.config.mjs` and `tailwind.config.ts`**

```js
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
out
*.log
```

- [ ] **Step 7: Create minimal `app/globals.css`, `app/layout.tsx`, `app/page.tsx`**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vijaya Bhaskar Jatoth",
  description: "Placeholder — replaced in a later task.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main>Scaffold OK</main>;
}
```

- [ ] **Step 8: Verify the static export builds**

Run: `npm run build`
Expected: build succeeds, `out/index.html` exists containing "Scaffold OK".

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts .gitignore app
git commit -m "Scaffold Next.js static-export project"
```

---

### Task 2: Content data + content-integrity tests

**Files:**
- Create: `content/site.ts`
- Create: `content/experience.ts`
- Test: `content/__tests__/content.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing (leaf data module).
- Produces: `site: { name, shortName, tagline, jobTitle, email, baseUrl,
  description, photo: { src, alt, width, height } }`, `nav: NavLink[]`,
  `social: SocialLink[]` from `content/site.ts`; `employment:
  TimelineEntry[]`, `credentials: TimelineEntry[]` from
  `content/experience.ts`, where `TimelineEntry = { period, org, role,
  description }`. Every later task that needs site facts imports from
  these two modules — no task should hardcode a name/date/link elsewhere.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

```ts
// content/__tests__/content.test.ts
import { describe, expect, it } from "vitest";
import { site, nav, social } from "../site";
import { employment, credentials } from "../experience";

const FORBIDDEN = [
  "XXXXX",
  "Punctual",
  "Often people default",
  "Born in India - Proud Indian",
  "Google+",
];

describe("content integrity", () => {
  it("has no forbidden placeholder/template strings", () => {
    const blob = JSON.stringify({ site, nav, social, employment, credentials });
    for (const bad of FORBIDDEN) {
      expect(blob).not.toContain(bad);
    }
  });

  it("only ships approved social links", () => {
    expect(social).toEqual([
      { label: "Instagram", href: "https://www.instagram.com/vijayabhaskarjatoth/" },
      { label: "Facebook", href: "https://www.facebook.com/vijayabhaskarofficial" },
    ]);
  });

  it("every social and nav link is a real https or in-site path, never '#'", () => {
    for (const link of [...social, ...nav]) {
      expect(link.href).not.toBe("#");
      expect(link.href.startsWith("https://") || link.href.startsWith("/")).toBe(true);
    }
  });

  it("nav covers exactly the four shipped routes", () => {
    expect(nav.map((n) => n.href)).toEqual(["/", "/about", "/experience", "/contact"]);
  });

  it("employment and credentials only reference verified organizations", () => {
    const allowedOrgs = [
      "stuMagz",
      "Tsearch.in",
      "ATAL Innovation Mission, Niti Aayog – GOI",
      "Microsoft",
    ];
    for (const entry of [...employment, ...credentials]) {
      expect(allowedOrgs).toContain(entry.org);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("site.email and site.baseUrl are correct", () => {
    expect(site.email).toBe("me@vijayabhaskar.in");
    expect(site.baseUrl).toBe("https://vijayabhaskar.in");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run content/__tests__/content.test.ts`
Expected: FAIL — `content/site.ts` and `content/experience.ts` don't exist yet.

- [ ] **Step 4: Implement `content/site.ts`**

```ts
export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export const nav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

export const social: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/vijayabhaskarjatoth/" },
  { label: "Facebook", href: "https://www.facebook.com/vijayabhaskarofficial" },
];

export const site = {
  name: "Vijaya Bhaskar Jatoth",
  shortName: "Vijaya Bhaskar",
  tagline: "Entrepreneur & Author",
  jobTitle: "Board Member, stuMagz",
  email: "me@vijayabhaskar.in",
  baseUrl: "https://vijayabhaskar.in",
  description:
    "Vijaya Bhaskar Jatoth is an entrepreneur based in Telangana, India, serving as a board member at stuMagz and Chief Academic Advisor for Manipal University, Karnataka.",
  photo: {
    src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjRFLi46ZHKuD1dGXQUXzrZrZvD_z263NiVUh3vTqe7aa9868W_QJXtYgy0NPtZfiY6hOHzRSqNAvrK36kKQNjgg5Wc8yA3U-ZlYPqPd3grM8xWa6h6EifLsjTBaNjp9vVt-TjaKWdwkbg/s320/IMG_20161016_011116.jpg",
    alt: "Portrait of Vijaya Bhaskar Jatoth",
    width: 320,
    height: 320,
  },
};
```

- [ ] **Step 5: Implement `content/experience.ts`**

```ts
export interface TimelineEntry {
  period: string;
  org: string;
  role: string;
  description: string;
}

export const employment: TimelineEntry[] = [
  {
    period: "2015 — Present",
    org: "stuMagz",
    role: "Board Member",
    description:
      "Appointed Executive Chairman of the board. Chief Academic Advisor for Manipal University, Karnataka.",
  },
  {
    period: "2009 — 2011",
    org: "Tsearch.in",
    role: "Marketing Manager",
    description:
      "Developed marketing strategy in line with company objectives, coordinated marketing campaigns with sales activities, and managed the marketing budget.",
  },
];

export const credentials: TimelineEntry[] = [
  {
    period: "2019",
    org: "ATAL Innovation Mission, Niti Aayog – GOI",
    role: "Mentor of Change",
    description:
      "Supports and reviews school-level innovation projects, giving feedback to management and students to improve outcomes.",
  },
  {
    period: "2015",
    org: "Microsoft",
    role: "SharePoint Developer",
    description: "Developed and implemented SharePoint-based solutions.",
  },
];
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run content/__tests__/content.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add content vitest.config.ts vitest.setup.ts package.json
git commit -m "Add site content data with content-integrity tests"
```

---

### Task 3: SEO infrastructure

**Files:**
- Create: `lib/seo.ts`
- Test: `lib/__tests__/seo.test.ts`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Interfaces:**
- Consumes: `site`, `social` from `content/site.ts` (Task 2).
- Produces: `buildMetadata({ title, description, path }): Metadata` and
  `personJsonLd(): object` from `lib/seo.ts`. Every page task (7–10) calls
  `buildMetadata` for its `export const metadata`. `personJsonLd` is
  consumed by the root layout (Task 7).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/seo.test.ts
import { describe, expect, it } from "vitest";
import { buildMetadata, personJsonLd } from "../seo";

describe("buildMetadata", () => {
  it("appends the site name to the title", () => {
    const meta = buildMetadata({
      title: "About",
      description: "Bio.",
      path: "/about",
    });
    expect(meta.title).toBe("About | Vijaya Bhaskar Jatoth");
  });

  it("builds an absolute canonical URL from the path", () => {
    const meta = buildMetadata({
      title: "About",
      description: "Bio.",
      path: "/about",
    });
    expect(meta.alternates?.canonical).toBe("https://vijayabhaskar.in/about");
  });
});

describe("personJsonLd", () => {
  it("is a schema.org Person referencing only approved social links", () => {
    const json = personJsonLd();
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe("Vijaya Bhaskar Jatoth");
    expect(json.sameAs).toEqual([
      "https://www.instagram.com/vijayabhaskarjatoth/",
      "https://www.facebook.com/vijayabhaskarofficial",
    ]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run lib/__tests__/seo.test.ts`
Expected: FAIL — `lib/seo.ts` doesn't exist yet.

- [ ] **Step 3: Implement `lib/seo.ts`**

```ts
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
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
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
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run lib/__tests__/seo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement `app/sitemap.ts` and `app/robots.ts`**

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/about", "/experience", "/contact"];
  return routes.map((route) => ({
    url: new URL(route, site.baseUrl).toString(),
    lastModified: new Date(),
  }));
}
```

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", site.baseUrl).toString(),
  };
}
```

- [ ] **Step 6: Verify the build still succeeds**

Run: `npm run build`
Expected: succeeds; `out/sitemap.xml` and `out/robots.txt` exist.

- [ ] **Step 7: Commit**

```bash
git add lib app/sitemap.ts app/robots.ts
git commit -m "Add SEO metadata helper, Person JSON-LD, sitemap and robots"
```

---

### Task 4: Design tokens (palette, type scale, fonts)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `lib/fonts.ts`
- Test: `tailwind.config.test.ts`

**Interfaces:**
- Produces: Tailwind theme colors `bg`, `ink`, `terracotta`, `ochre`,
  `teal`; `fontFamily.display` / `fontFamily.body`. `fraunces` and
  `publicSans` exports from `lib/fonts.ts`, each a `next/font/google`
  result exposing `.variable`. Task 7 (root layout) applies both
  `.variable` classes to `<html>`.

- [ ] **Step 1: Write the failing test**

```ts
// tailwind.config.test.ts
import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

describe("tailwind design tokens", () => {
  it("defines the Warm Regional Identity palette", () => {
    const colors = (config.theme?.extend as any)?.colors;
    expect(colors.bg).toBe("#FBF3E7");
    expect(colors.ink).toBe("#2B211A");
    expect(colors.terracotta).toBe("#C1512D");
    expect(colors.ochre).toBe("#B3792C");
    expect(colors.teal).toBe("#1F5C56");
  });

  it("defines display/body font families backed by CSS variables", () => {
    const fonts = (config.theme?.extend as any)?.fontFamily;
    expect(fonts.display).toContain("var(--font-fraunces)");
    expect(fonts.body).toContain("var(--font-public-sans)");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tailwind.config.test.ts`
Expected: FAIL — tokens not defined yet.

- [ ] **Step 3: Update `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FBF3E7",
        ink: "#2B211A",
        terracotta: "#C1512D",
        ochre: "#B3792C",
        teal: "#1F5C56",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run tailwind.config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create `lib/fonts.ts`**

```ts
import { Fraunces, Public_Sans } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});
```

- [ ] **Step 6: Update `app/globals.css` with base tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #fbf3e7;
  color: #2b211a;
}
```

- [ ] **Step 7: Verify the build still succeeds**

Run: `npm run build`
Expected: succeeds (fonts aren't wired into layout until Task 7, so this
just confirms Tailwind config and globals.css are valid).

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.ts tailwind.config.test.ts app/globals.css lib/fonts.ts
git commit -m "Add Warm Regional Identity design tokens and self-hosted fonts"
```

---

### Task 5: Visual motif components

**Files:**
- Create: `components/SectionDivider.tsx`
- Create: `components/Texture.tsx`
- Create: `components/PhotoFrame.tsx`
- Test: `components/__tests__/SectionDivider.test.tsx`
- Test: `components/__tests__/Texture.test.tsx`
- Test: `components/__tests__/PhotoFrame.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `<SectionDivider className? />`, `<Texture className? />`,
  `<PhotoFrame src alt width height className? />` — all plain
  presentational components with no external state. Consumed by page
  tasks (7–10).

- [ ] **Step 1: Write the failing tests**

```tsx
// components/__tests__/SectionDivider.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionDivider from "../SectionDivider";

describe("SectionDivider", () => {
  it("renders a decorative, hidden-from-a11y-tree svg", () => {
    const { container } = render(<SectionDivider />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
```

```tsx
// components/__tests__/Texture.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Texture from "../Texture";

describe("Texture", () => {
  it("renders a decorative svg pattern", () => {
    const { container } = render(<Texture />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("pattern#ikat-weave")).toBeTruthy();
  });
});
```

```tsx
// components/__tests__/PhotoFrame.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PhotoFrame from "../PhotoFrame";

describe("PhotoFrame", () => {
  it("renders the image with correct src, alt and dimensions", () => {
    render(
      <PhotoFrame src="https://example.com/photo.jpg" alt="Test alt" width={320} height={320} />
    );
    const img = screen.getByAltText("Test alt");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("width", "320");
    expect(img).toHaveAttribute("height", "320");
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run components/__tests__`
Expected: FAIL — components don't exist yet.

- [ ] **Step 3: Implement `components/SectionDivider.tsx`**

```tsx
export default function SectionDivider({ className }: { className?: string }) {
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      viewBox="0 0 200 12"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M0 6 C 20 0, 40 12, 60 6 S 100 0, 120 6 S 160 12, 180 6 S 200 0, 200 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Implement `components/Texture.tsx`**

```tsx
export default function Texture({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width="100%" height="100%">
      <defs>
        <pattern id="ikat-weave" width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 12 L12 0 L24 12 L12 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ikat-weave)" />
    </svg>
  );
}
```

- [ ] **Step 5: Implement `components/PhotoFrame.tsx`**

```tsx
interface PhotoFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function PhotoFrame({ src, alt, width, height, className }: PhotoFrameProps) {
  return (
    <div className={`photo-frame ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} height={height} loading="lazy" />
    </div>
  );
}
```

- [ ] **Step 6: Add the organic-blob frame style to `app/globals.css`**

```css
.photo-frame {
  overflow: hidden;
  border-radius: 63% 37% 54% 46% / 43% 41% 59% 57%;
  display: inline-block;
}

.photo-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 7: Run tests, verify they pass**

Run: `npx vitest run components/__tests__`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add components app/globals.css
git commit -m "Add SectionDivider, Texture and PhotoFrame motif components"
```

---

### Task 6: Site chrome (Header, Footer)

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`
- Test: `components/__tests__/Header.test.tsx`
- Test: `components/__tests__/Footer.test.tsx`

**Interfaces:**
- Consumes: `nav`, `social`, `site` from `content/site.ts` (Task 2).
- Produces: `<Header />`, `<Footer />` — consumed by the root layout
  (Task 7).

- [ ] **Step 1: Write the failing tests**

```tsx
// components/__tests__/Header.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Header from "../Header";
import { nav } from "@/content/site";

describe("Header", () => {
  it("renders a link for every nav entry with the correct href", () => {
    render(<Header />);
    for (const item of nav) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
    }
  });
});
```

```tsx
// components/__tests__/Footer.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "../Footer";
import { social, site } from "@/content/site";

describe("Footer", () => {
  it("renders every approved social link opening in a new tab", () => {
    render(<Footer />);
    for (const item of social) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    }
  });

  it("includes the site name in the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(site.name))).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run components/__tests__/Header.test.tsx components/__tests__/Footer.test.tsx`
Expected: FAIL — components don't exist yet.

- [ ] **Step 3: Implement `components/Header.tsx`**

```tsx
import Link from "next/link";
import { nav, site } from "@/content/site";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        {site.shortName}
      </Link>
      <nav aria-label="Primary">
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Implement `components/Footer.tsx`**

```tsx
import { site, social } from "@/content/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p>
        © {year} {site.name}
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
    </footer>
  );
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run components/__tests__/Header.test.tsx components/__tests__/Footer.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add components/Header.tsx components/Footer.tsx components/__tests__
git commit -m "Add Header and Footer site chrome"
```

---

### Task 7: Root layout integration + Home page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `fraunces`, `publicSans` (Task 4); `buildMetadata`,
  `personJsonLd` (Task 3); `Header`, `Footer`, `PhotoFrame`,
  `SectionDivider` (Tasks 5–6); `site` (Task 2).
- Produces: the shared page shell every route (Tasks 8–10) renders inside.

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { fraunces, publicSans } from "@/lib/fonts";
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
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="font-body bg-bg text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Type-check and build**

Run: `npm run typecheck && npm run build`
Expected: both succeed; `out/index.html` contains "Vijaya Bhaskar Jatoth"
and "Entrepreneur & Author".

- [ ] **Step 4: Run the full test suite to confirm nothing broke**

Run: `npm run test`
Expected: all existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "Wire root layout and build the Home page"
```

---

### Task 8: About page

**Files:**
- Create: `app/about/page.tsx`

**Interfaces:**
- Consumes: `site` (Task 2), `buildMetadata` (Task 3), `PhotoFrame` (Task 5).

- [ ] **Step 1: Implement `app/about/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check and build**

Run: `npm run typecheck && npm run build`
Expected: succeeds; `out/about/index.html` exists and contains "stuMagz"
(present via `site.description`, defined in Task 2).

- [ ] **Step 3: Commit**

```bash
git add app/about
git commit -m "Add About page"
```

---

### Task 9: Experience page

**Files:**
- Create: `app/experience/page.tsx`

**Interfaces:**
- Consumes: `employment`, `credentials` (Task 2), `buildMetadata` (Task 3),
  `SectionDivider` (Task 5).

- [ ] **Step 1: Implement `app/experience/page.tsx`**

```tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, type TimelineEntry } from "@/content/experience";
import SectionDivider from "@/components/SectionDivider";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

function Timeline({ title, entries }: { title: string; entries: TimelineEntry[] }) {
  return (
    <div>
      <h2 className="font-display">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={`${entry.org}-${entry.period}`}>
            <span>{entry.period}</span>
            <h3>
              {entry.role} · {entry.org}
            </h3>
            <p>{entry.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExperiencePage() {
  return (
    <section>
      <h1 className="font-display">Experience</h1>
      <Timeline title="Employment" entries={employment} />
      <SectionDivider />
      <Timeline title="Credentials" entries={credentials} />
    </section>
  );
}
```

- [ ] **Step 2: Type-check and build**

Run: `npm run typecheck && npm run build`
Expected: succeeds; `out/experience/index.html` contains "stuMagz",
"Tsearch.in", "ATAL Innovation Mission", and "SharePoint".

- [ ] **Step 3: Commit**

```bash
git add app/experience
git commit -m "Add Experience page with employment and credentials timelines"
```

---

### Task 10: Contact page

**Files:**
- Create: `app/contact/page.tsx`

**Interfaces:**
- Consumes: `site`, `social` (Task 2), `buildMetadata` (Task 3).

- [ ] **Step 1: Implement `app/contact/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Type-check and build**

Run: `npm run typecheck && npm run build`
Expected: succeeds; `out/contact/index.html` contains
`href="mailto:me@vijayabhaskar.in"` and no `href="#"`.

- [ ] **Step 3: Commit**

```bash
git add app/contact
git commit -m "Add Contact page"
```

---

### Task 11: Open Graph image

**Files:**
- Create: `app/opengraph-image.tsx`

**Interfaces:**
- Consumes: `site` (Task 2). Applies automatically to every route's
  metadata via Next's file-convention inheritance — no changes needed in
  `lib/seo.ts` or any page task.

- [ ] **Step 1: Implement `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#FBF3E7",
          color: "#2B211A",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>{site.name}</div>
        <div style={{ fontSize: 32, color: "#C1512D", marginTop: 20 }}>{site.tagline}</div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Build and confirm the image and its meta tags are emitted**

Run: `npm run build`
Expected: succeeds; `out/index.html` contains a
`<meta property="og:image" ...>` tag with an absolute URL under
`https://vijayabhaskar.in`.

- [ ] **Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "Add site-wide Open Graph image"
```

---

### Task 12: Static export verification script

**Files:**
- Create: `scripts/verify-export.mjs`
- Modify: `package.json` (already has the `verify:export` script from
  Task 1 — this task implements the script it points to)

**Interfaces:**
- Consumes: the built `out/` directory produced by `npm run build`
  (Tasks 1–11 must have already run).
- Produces: a process that exits non-zero and prints diagnostics if any
  Global Constraint is violated in the shipped HTML — used as a CI gate in
  Task 13.

- [ ] **Step 1: Confirm the script is missing (fails today)**

Run: `npm run verify:export`
Expected: FAIL — `Cannot find module '.../scripts/verify-export.mjs'`.

- [ ] **Step 2: Implement `scripts/verify-export.mjs`**

```js
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = "out";

const requiredFiles = [
  "index.html",
  "about/index.html",
  "experience/index.html",
  "contact/index.html",
  "sitemap.xml",
  "robots.txt",
  "CNAME",
];

const forbiddenStrings = [
  "XXXXX",
  'href="#"',
  "Google+",
  "Punctual",
  "Often people default",
  "Born in India - Proud Indian",
];

const requiredStrings = ["stuMagz", "Tsearch.in", "ATAL Innovation Mission", "SharePoint"];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(join(outDir, file))) {
    console.error(`MISSING: ${file}`);
    failed = true;
  }
}

const htmlFiles = requiredFiles.filter((f) => f.endsWith(".html"));
const html = htmlFiles
  .filter((f) => existsSync(join(outDir, f)))
  .map((f) => readFileSync(join(outDir, f), "utf8"))
  .join("\n");

for (const bad of forbiddenStrings) {
  if (html.includes(bad)) {
    console.error(`FORBIDDEN STRING FOUND: "${bad}"`);
    failed = true;
  }
}

for (const good of requiredStrings) {
  if (!html.includes(good)) {
    console.error(`MISSING REQUIRED FACT: "${good}"`);
    failed = true;
  }
}

if (!html.includes('property="og:image"')) {
  console.error("MISSING og:image meta tag");
  failed = true;
}

if (failed) {
  console.error("\nExport verification FAILED.");
  process.exit(1);
} else {
  console.log("Export verification passed: no placeholders, all required facts present.");
  process.exit(0);
}
```

- [ ] **Step 3: Build, then add the CNAME file the script checks for**

Run: `npm run build`
Expected: succeeds. Note: `out/CNAME` won't exist yet since `public/CNAME`
is created in Task 13 — run this task's verification again after Task 13
if it fails on the CNAME check now; that's expected sequencing, not a bug.

- [ ] **Step 4: Run verification, confirm it reports the missing CNAME clearly**

Run: `npm run verify:export`
Expected: FAILS with exactly `MISSING: CNAME` (all other checks pass) —
this confirms the script correctly detects real problems, not false
positives.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-export.mjs
git commit -m "Add static export verification script"
```

---

### Task 13: GitHub Pages deployment

**Files:**
- Create: `public/CNAME`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` and `npm run verify:export` (Tasks 1–12).
- Produces: an automated deploy on push to `main`.

- [ ] **Step 1: Create `public/CNAME`**

```
vijayabhaskar.in
```

(No trailing newline conventions matter here; a single line with just the
domain is correct.)

- [ ] **Step 2: Re-run verification now that the CNAME exists**

Run: `npm run build && npm run verify:export`
Expected: PASS — all required files present, no forbidden strings, all
required facts present, og:image tag present.

- [ ] **Step 3: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch: {}

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run verify:export
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Commit**

```bash
git add public/CNAME .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
```

- [ ] **Step 5: Manual follow-up (outside this repo, cannot be automated
      here) — tell the user to do these before the site goes live:**

  1. In the GitHub repo settings → Pages, set the source to
     "GitHub Actions" (not "Deploy from a branch").
  2. Push this branch to `main` on `origin` (`vijayabhaskar00/vijaysite`)
     to trigger the workflow.
  3. At the domain registrar for `vijayabhaskar.in`, point DNS to GitHub
     Pages: an `A` record set for the apex domain to GitHub's Pages IPs
     (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), or a `CNAME`
     record for `www` to `vijayabhaskar00.github.io` if serving from `www`
     instead of the apex — confirm current DNS setup before changing it.
  4. Once DNS propagates, verify HTTPS is enforced in the Pages settings
     (GitHub auto-provisions a certificate for custom domains).

---

## Final verification (after Task 13)

Run in order:

```bash
npm run typecheck
npm run test
npm run build
npm run verify:export
```

All four must succeed with zero errors before considering the site ready
to deploy.

**Manual QA (spec-required, not automatable in this plan):**
- Run a Lighthouse audit against the production build (`npx serve out` then
  audit in Chrome DevTools) — Performance, Accessibility, Best Practices,
  and SEO should each score 90+ per the spec's target.
- Check the site at mobile, tablet, and desktop breakpoints in a browser.
- Proofread every page's rendered text against the verified-facts list in
  the spec (`docs/superpowers/specs/2026-08-13-personal-site-design.md`)
  one more time before flipping DNS.
