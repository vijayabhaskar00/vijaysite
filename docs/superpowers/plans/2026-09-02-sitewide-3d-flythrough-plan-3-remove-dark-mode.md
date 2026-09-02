# Site-wide 3D Fly-Through — Plan 3: Remove Dark Mode

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the light/dark theme system entirely — toggle, bootstrap script, `useTheme`, the `AmbientColorDrift` ambient layer, and the dark palette — leaving one carefully-lit warm clay look.

**Architecture:** The theme system is three cooperating pieces: an inline `<script>` in `app/layout.tsx` that stamps `data-theme` before paint (`lib/themeBootstrap.ts`), a `useTheme()` hook + `ThemeToggle` button (`lib/theme.ts`, `components/ThemeToggle.tsx`), and a `:root[data-theme="dark"]` override block in `app/globals.css` that re-defines every design token. `AmbientColorDrift` is the only component that consumes `useTheme()`. This plan deletes all of it and the tests that assert dark-mode behavior; the light `:root` palette and every `bg-*/text-*` utility are untouched.

**Tech Stack:** Same as Plan 1. No dependency changes.

**Spec:** `docs/superpowers/specs/2026-09-02-sitewide-3d-flythrough-design.md` ("Dark mode — removed entirely").

**Depends on:** nothing structurally — this plan is independent and may run before, between, or after Plans 1–2. **One ordering note:** if Plan 1 has *not* run yet, `app/page.tsx` still renders `<AmbientColorDrift />`; Task 3 Step 2 covers removing that mount in either case.

## Global Constraints

- `npm run build && npm run verify:export` passes unmodified. `verify-export.mjs`'s palette check reads the compiled CSS for the light-theme decimal RGB triples — those come from `:root`, which this plan does not touch, so it keeps passing.
- The light `:root` token block in `app/globals.css` and every value in `tailwind.config.ts`'s `colors` map stay exactly as they are.
- `scrollbar-gutter: stable` on `html` (globals.css) stays — it is not theme-related.
- No visual change to the site in its default (light) state.

---

## File Structure

```
DELETE:
  components/ThemeToggle.tsx
  components/__tests__/ThemeToggle.test.tsx
  lib/theme.ts
  lib/__tests__/theme.test.ts
  lib/themeBootstrap.ts
  lib/__tests__/themeBootstrap.test.ts
  components/motion/AmbientColorDrift.tsx
  components/motion/__tests__/AmbientColorDrift.test.tsx

MODIFY:
  components/Header.tsx           — drop <ThemeToggle/> + its now-single-child wrapper
  components/__tests__/Header.test.tsx  — drop the theme-toggle-row alignment test
  app/layout.tsx                  — drop the theme <Script>, its import, suppressHydrationWarning
  app/page.tsx                    — drop <AmbientColorDrift/> import + element (if still present)
  app/globals.css                — delete the :root[data-theme="dark"] block
  tailwind.config.ts             — drop the darkMode line
  tailwind.config.test.ts        — drop the two dark-mode assertions
```

---

### Task 1: Remove `ThemeToggle` from the header

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/__tests__/Header.test.tsx`
- Delete: `components/ThemeToggle.tsx`, `components/__tests__/ThemeToggle.test.tsx`

- [ ] **Step 1: Edit `components/Header.tsx`**

Remove the import:

```tsx
import ThemeToggle from "@/components/ThemeToggle";
```

The nav currently sits inside `<div className="flex items-start gap-3">` alongside `<ThemeToggle />`. With the toggle gone, that wrapper has one child — collapse it. Change:

```tsx
        <div className="flex items-start gap-3">
          <nav aria-label="Primary">
            {/* ...ul... */}
          </nav>
          <ThemeToggle />
        </div>
```

to:

```tsx
        <nav aria-label="Primary">
          {/* ...ul unchanged... */}
        </nav>
```

Leave the outer `<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between ...">` alone — the logo `<Magnetic>` and `<nav>` are still its two flex children, so `justify-between` still does the right thing.

- [ ] **Step 2: Update `components/__tests__/Header.test.tsx`**

Delete the last test entirely — `"aligns the nav+theme-toggle row to the top..."` — it asserts a wrapper (`nav.parentElement` has `items-start`) that no longer exists. Its regression (the toggle floating between wrapped nav rows) is moot once there is no toggle.

Keep all four other tests unchanged (nav links, active-page marking x2, no baked opacity:0).

- [ ] **Step 3: Delete the toggle files**

```bash
git rm components/ThemeToggle.tsx components/__tests__/ThemeToggle.test.tsx
```

- [ ] **Step 4: Typecheck + test**

Run: `npm run typecheck && npx vitest run components/__tests__/Header.test.tsx`
Expected: PASS — 4 tests. Typecheck confirms nothing else imported `ThemeToggle`.

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/__tests__/Header.test.tsx
git commit -m "Remove the theme toggle from the header"
```

---

### Task 2: Delete `useTheme` and the bootstrap module

**Files:**
- Delete: `lib/theme.ts`, `lib/__tests__/theme.test.ts`, `lib/themeBootstrap.ts`, `lib/__tests__/themeBootstrap.test.ts`

**Interfaces:** after this task nothing exports `useTheme`, `Theme`, `themeBootstrapScript`, or `THEME_STORAGE_KEY`. Task 3 removes the last consumers (`layout.tsx`, `AmbientColorDrift`); do this task and Task 3 together if executing in one pass, or expect a red typecheck between them.

- [ ] **Step 1: Confirm the only consumers are `layout.tsx` and `AmbientColorDrift.tsx`**

Run: `git grep -n "lib/theme\|themeBootstrap\|useTheme"`
Expected matches: `app/layout.tsx`, `components/motion/AmbientColorDrift.tsx`, `components/ThemeToggle.tsx` (already deleted in Task 1), and the test files. If anything else appears, stop and fold its cleanup into this plan.

- [ ] **Step 2: Delete the files**

```bash
git rm lib/theme.ts lib/__tests__/theme.test.ts lib/themeBootstrap.ts lib/__tests__/themeBootstrap.test.ts
```

- [ ] **Step 3: Do not run typecheck yet** — `layout.tsx` and `AmbientColorDrift.tsx` still import these. Proceed straight to Task 3, then typecheck.

- [ ] **Step 4: Stage (commit with Task 3)**

```bash
git add -A
```

---

### Task 3: Strip theme wiring from `layout.tsx` and delete `AmbientColorDrift`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx` (only if Plan 1 has not already removed the mount)
- Delete: `components/motion/AmbientColorDrift.tsx`, `components/motion/__tests__/AmbientColorDrift.test.tsx`

- [ ] **Step 1: Edit `app/layout.tsx`**

Remove:
- `import { themeBootstrapScript } from "@/lib/themeBootstrap";`
- the entire `<Script id="theme-bootstrap" strategy="beforeInteractive">{themeBootstrapScript()}</Script>` element
- `suppressHydrationWarning` from the `<html>` tag and the comment above it explaining the intentional theme mismatch
- the `import Script from "next/script";` line **only if** no other `<Script>` remains in the file (the JSON-LD block uses a plain `<script>`, not `next/script` — so `Script` is now unused; remove it)

The `<html>` tag becomes:

```tsx
    <html lang="en" className={`${baloo2.variable} ${nunito.variable}`}>
```

- [ ] **Step 2: Remove the `AmbientColorDrift` mount from `app/page.tsx`**

Run: `git grep -n "AmbientColorDrift" app/page.tsx`
- If it matches (Plan 1 not yet run): remove `import AmbientColorDrift from "@/components/motion/AmbientColorDrift";` and the `<AmbientColorDrift />` element.
- If it does not match (Plan 1 already removed it): nothing to do.

- [ ] **Step 3: Delete the component**

```bash
git rm components/motion/AmbientColorDrift.tsx components/motion/__tests__/AmbientColorDrift.test.tsx
```

- [ ] **Step 4: Typecheck + full test suite**

Run: `npm run typecheck && npm test`
Expected: PASS. Typecheck now confirms zero dangling references to the deleted theme modules. The `AmbientColorDrift` test is gone; no other test referenced it.

- [ ] **Step 5: Commit (Tasks 2 + 3 together)**

```bash
git add -A
git commit -m "Delete useTheme, the theme bootstrap script, and AmbientColorDrift"
```

---

### Task 4: Remove the dark palette from CSS and Tailwind config

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `tailwind.config.test.ts`

- [ ] **Step 1: Delete the dark block in `app/globals.css`**

Remove the entire comment + rule:

```css
/* Dark theme: same clay-neumorphic language, re-tuned rather than inverted ... */
:root[data-theme="dark"] {
  --color-cream: 27 20 15;
  /* ...every line through... */
  --spotlight-glow: rgba(255, 255, 255, 0.12);
}
```

Leave the `:root { ... }` light block, `html { scrollbar-gutter: stable; }`, `body { ... }`, and everything below untouched.

- [ ] **Step 2: Remove `darkMode` from `tailwind.config.ts`**

Delete the line:

```ts
  darkMode: ["selector", '[data-theme="dark"]'],
```

- [ ] **Step 3: Update `tailwind.config.test.ts`**

Delete two `it(...)` blocks:
- `"defines a dark theme override block that re-defines every color and shadow token"`
- `"enables selector-based dark mode keyed off [data-theme=dark]"`

Keep the other four (rgb-var wrapper, light `:root` triples, font families, shadow tokens) — those assert the light system, which is unchanged.

- [ ] **Step 4: Typecheck + test**

Run: `npm run typecheck && npx vitest run tailwind.config.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.ts tailwind.config.test.ts
git commit -m "Drop the dark palette and darkMode config"
```

---

### Task 5: Full verification

**Files:** none.

- [ ] **Step 1:** `npm run typecheck` → PASS.
- [ ] **Step 2:** `npm test` → PASS. Expect the test count to drop by the deleted suites (`ThemeToggle`, `theme`, `themeBootstrap`, `AmbientColorDrift`, one `Header` test, two `tailwind.config` tests) and nothing else.
- [ ] **Step 3:** `git grep -in "data-theme\|useTheme\|themeBootstrap\|ThemeToggle\|AmbientColorDrift\|darkMode\|dark:"` → only hits in `docs/` (the specs/plans) remain. Any hit in `app/`, `components/`, `lib/`, `tailwind.config.ts` is a miss to clean up.
- [ ] **Step 4:** `npm run build && npm run verify:export` → PASS, `Export verification passed`. The palette check passes because the light `:root` triples are intact.
- [ ] **Step 5: Dev-server smoke.** `npm run dev`, open `/`. Confirm the site looks identical to before this plan (warm clay, light), the header has no toggle button, and there is no flash — `suppressHydrationWarning` removal is safe now because nothing mutates `<html>` before hydration, so server and client markup match.
- [ ] **Step 6:** `git grep` the `README.md` for any "dark mode" mention and remove that line if present.
- [ ] **Step 7:** If all green, Plan 3 is complete.

---

## Self-Review

**Spec coverage:** the spec's "Dark mode — removed entirely: toggle, bootstrap script, dark tokens, `AmbientColorDrift`" maps to: toggle → Task 1; `useTheme`/bootstrap → Task 2; layout wiring + `AmbientColorDrift` → Task 3; dark tokens + `darkMode` → Task 4. Verification → Task 5.

**Placeholder scan:** none. Every deletion target is named with its exact path; every edit shows the before/after text.

**Type consistency:** this plan only deletes exports (`useTheme`, `Theme`, `themeBootstrapScript`, `THEME_STORAGE_KEY`) and their consumers in the same pass (Tasks 2+3 committed together), so there is no window where a referenced symbol is undefined at a committed state — except the deliberately-flagged red typecheck *between* Task 2 and Task 3 within a single execution pass, which Task 3 Step 4 resolves before the commit.

**Ordering with Plans 1–2:** independent. The only coupling is the `<AmbientColorDrift />` mount in `app/page.tsx`, handled conditionally in Task 3 Step 2. If Plan 1 runs first, that step is a no-op; if Plan 3 runs first, Plan 1 Task 9's homepage rewrite simply won't re-add the import (it is written to omit it).
