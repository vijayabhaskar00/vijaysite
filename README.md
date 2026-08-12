# vijayabhaskar.in

The personal site for Vijaya Bhaskar Jatoth. A fully static Next.js 14 (App
Router, TypeScript) build — no CMS, no server — with content in typed
modules under `content/`, styled with Tailwind CSS against the "Warm
Regional Identity" design tokens in `tailwind.config.ts`. Deployed to GitHub
Pages on the custom domain `vijayabhaskar.in`.

See `docs/superpowers/specs/2026-08-13-personal-site-design.md` and
`docs/superpowers/plans/2026-08-13-personal-site.md` for the full design
spec and implementation plan this site was built from.

## Local development

```bash
npm install
npm run dev          # start the dev server at http://localhost:3000
```

## Build and verify

```bash
npm run build         # static export (output: 'export') into out/
npm run test          # Vitest unit/component tests
npm run typecheck     # tsc --noEmit
npm run verify:export # content-integrity + design-token checks against out/
```

`verify:export` must be run after `build` — it inspects the files that
`next build` produced in `out/`. Run all four before opening a PR:

```bash
npm run typecheck && npm run test && npm run build && npm run verify:export
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
static export and publishes it via GitHub Pages' native Actions deployment
(`actions/upload-pages-artifact` + `actions/deploy-pages`). There is no
`gh-pages` branch.

### One-time setup for a new deployment target

A site owner setting this up for the first time (or moving it to a new
GitHub repo/account) needs to do the following manually — none of it is
automated by the workflow:

1. **Enable GitHub Pages via Actions.** In the repo's Settings → Pages, set
   "Source" to **GitHub Actions** (not "Deploy from a branch"). Without
   this, `actions/deploy-pages` has nothing to publish to.
2. **Push to `main`.** The workflow only runs on pushes to `main`; the first
   successful run publishes the site to the `github.io` URL (and then the
   custom domain once DNS below is live).
3. **Configure DNS for the custom domain.** `public/CNAME` pins the domain
   to `vijayabhaskar.in`, but the domain registrar still needs the DNS
   records pointed at GitHub Pages:
   - For the **apex domain** (`vijayabhaskar.in`): four `A` records to
     GitHub Pages' IPs — `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`.
   - For `www.vijayabhaskar.in` (if used): a `CNAME` record pointing to the
     GitHub Pages hostname (`<username>.github.io`).
   Use whichever of the two your registrar's setup calls for — most
   registrars require the apex `A` records regardless, since not all
   support `CNAME`/`ALIAS` at the zone apex.

Once DNS has propagated, GitHub Pages will auto-provision an HTTPS
certificate for the custom domain — no extra step needed.
