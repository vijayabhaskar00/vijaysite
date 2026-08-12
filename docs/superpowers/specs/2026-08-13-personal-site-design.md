# vijayabhaskar.in — Personal Site Redesign

Status: approved for planning
Date: 2026-08-13

## Background

The live site at vijayabhaskar.in is an unedited 2020 Blogger "vCard" template
(Websoham / Gooyaabi Templates). Inspecting the rendered HTML directly (not
just the visible text) showed that much of its content is literal, never-filled
template filler:

- Bio: *"When I began my start-up, my mentor, XXXXX, taught me..."* — the
  placeholder name was never replaced.
- Personal info: *"Often people default to telling their entire life story."*
  — boilerplate instructional copy left in place.
- Address: *"Born in India - Proud Indian"* — not a real address, template
  filler.
- Skills section: generic template stats (Photography, Illustrator,
  "Punctual 91%") with no connection to the subject's actual work.
- Social links: three different Twitter handles used inconsistently across
  the page (header/profile/footer), a Google+ link (service shut down 2019),
  and dead `#` placeholders for LinkedIn, Behance, and YouTube.

The only verified, real facts on the page are: name (Vijaya Bhaskar Jatoth),
email, board role at stuMagz (2015–present), prior role at Tsearch.in
(2009–2011), a Microsoft SharePoint credential (2015), and a "Mentor of
Change" credential with the ATAL Innovation Mission, Niti Aayog – GOI (2019).
He is positioned as an "Entrepreneur, Indian Author" but no book titles,
publications, or writing links appear anywhere on the source site.

This project rebuilds the site from scratch as a real, credible personal
site rather than re-skinning the template. Content is limited to verified
facts; nothing is fabricated to fill gaps.

## Goals

- Replace the Blogger template with a fast, SEO-strong static site hosted on
  GitHub Pages at the existing custom domain vijayabhaskar.in.
- A visual identity distinct from generic AI-generated/template portfolio
  patterns (centered hero + blue gradient + glassmorphism + Inter font).
- Content that is accurate and honest about what's verifiable — placeholder
  and dead-link content removed, not replaced with invented substitutes.

## Non-goals

- No CMS/backend — this is a static, single-owner site with content in code.
- No working contact form backend (no server available on GitHub Pages) —
  contact is a `mailto:` link plus real social links.
- No blog engine on the new site — writing/blog content stays on the existing
  Blogger blog; the new site links out to it from a `/writing` page.

## Content decisions (confirmed with site owner)

- **Content approach:** clean up only what's verifiable on the current site.
  Drop all placeholder/filler text identified above. No fabricated
  achievements, no invented book titles.
- **Social links:** Instagram (`vijayabhaskarjatoth`) and Facebook
  (`vijayabhaskarofficial`) only — these were the two with a single
  consistent handle in the source. Twitter/X is dropped rather than guessing
  which of the three source handles is correct. Google+, LinkedIn, Behance,
  YouTube dead links are dropped.
- **Contact:** `mailto:me@vijayabhaskar.in` link plus the two social icons.
  No phone number or DOB published (those were on the old site but aren't
  necessary or advisable to publish on a professional profile).
- **Photo:** reuse the existing Blogger-hosted profile photo
  (`blogger.googleusercontent.com/.../IMG_20161016_011116.jpg`) at its
  current resolution.
- **Writing/"Author" positioning:** `/writing` page introduces this in his
  own words and links out to the Blogger blog (URL: the blog feed found at
  `blogger.com/feeds/7930706235641360655/posts/default` — resolve to the
  human-facing blog URL during implementation).

## Architecture

- **Framework:** Next.js 14 (App Router), TypeScript.
- **Rendering:** fully static export (`output: 'export'` in `next.config`).
  No server runtime — required for GitHub Pages.
- **Styling:** Tailwind CSS, but driven by a custom design-token layer
  (color/type/spacing scale defined in `tailwind.config` + CSS variables) —
  not left at Tailwind defaults, which read as templated.
- **Content:** typed local content files under `/content/*.ts` (experience
  entries, credentials, social links, site copy). No headless CMS — content
  volume doesn't justify one, and it keeps the site a plain static build.
- **Fonts:** self-hosted (not Google Fonts CDN at runtime) for performance
  and to avoid a third-party render-blocking request.
- **Deployment:** GitHub Actions workflow using GitHub Pages' native Actions
  deployment (`actions/upload-pages-artifact` + `actions/deploy-pages`) —
  build the static export on push to `main` and publish directly, no
  `gh-pages` branch needed. A `public/CNAME` file pins the custom domain
  `vijayabhaskar.in`.

## Information architecture

Multi-page rather than the original's single scrolling page — distinct URLs
with unique `<title>`/meta description per page perform better for SEO than
a one-pager where every section shares the homepage's metadata.

| Route | Purpose |
|---|---|
| `/` | Hero + short intro + highlights, links into other pages |
| `/about` | Full bio |
| `/experience` | Employment (stuMagz, Tsearch.in) + credentials (ATAL Innovation Mission, Microsoft SharePoint) as a timeline — no fabricated skill-percentage bars |
| `/writing` | Author positioning in his own words; links out to the Blogger blog |
| `/contact` | `mailto:` link + Instagram/Facebook icons |

Shared layout: header nav (Home / About / Experience / Writing / Contact),
footer with copyright + social icons.

## Visual system — "Warm Regional Identity"

- **Palette:** warm ivory/cream background, deep charcoal-brown text,
  terracotta/ochre as the primary accent, a small deep-teal accent for links
  and interactive states. No blue-gradient/glassmorphism.
- **Type:** a warm serif for display headings (Fraunces or Newsreader) paired
  with a clean humanist sans for body text (Public Sans or Work Sans) —
  deliberately not Inter or a system-default stack.
- **Motifs:** organic-mask treatment on the profile photo, hand-drawn-style
  SVG section dividers, a subtle woven/ikat-inspired texture
  (CSS/SVG-generated, not a stock texture image) used sparingly as section
  accents — a nod to Telangana textile tradition without being literal.
- **Layout:** asymmetric section composition, generous whitespace; avoids
  the centered-hero-with-gradient pattern common to templated/AI-generated
  portfolio sites.
- Implementation of this visual system should invoke the `frontend-design`
  skill during the build for concrete typography/spacing/color decisions.

## SEO

- Semantic HTML throughout (`header`/`nav`/`main`/`section`/`footer`,
  correct heading hierarchy).
- Unique `<title>` and meta description per route.
- JSON-LD `Person` structured data on the homepage: name, jobTitle,
  worksFor, `sameAs` (real social URLs only), url.
- Open Graph + Twitter Card meta tags with a custom OG image (built for this
  site, not reused from the old one).
- `sitemap.xml` and `robots.txt` generated at build time.
- Self-hosted fonts with `font-display: swap`; compressed/responsive images.
- Target: 90+ on all four Lighthouse categories (Performance, Accessibility,
  Best Practices, SEO).

## Testing / QA

- Lighthouse audit against the production build, all four categories ≥90.
- Responsive check at mobile / tablet / desktop breakpoints.
- Manual content proofread against the verified-facts list in this doc —
  confirm nothing fabricated slipped in.
- Link check: every outbound link (social, blog, mailto) resolves and is
  correct; no `#` dead links ship.
- `next build` with `output: 'export'` succeeds with zero errors, confirming
  GitHub Pages compatibility (no server-only APIs used).

## Open item for implementation time

The Blogger blog's human-facing URL should be confirmed (the feed URL found
during research is `blogger.com/feeds/7930706235641360655/posts/default`;
the `/writing` page needs the actual blog homepage URL, likely
`vijayabhaskar.in` itself pre-migration or a `blogspot.com` subdomain —
verify before linking).
