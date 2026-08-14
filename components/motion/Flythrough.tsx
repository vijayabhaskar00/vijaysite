"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { detectWebGL2, prefersReducedMotion, resolveDeviceTier, type DeviceTier } from "./deviceTier";
import IntroOverlay from "./IntroOverlay";
import Waypoint from "./Waypoint";
import PinnedStatement from "./PinnedStatement";
import type { CameraKeyframe } from "./FlyPath";
import { site, social } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import OrgMark from "@/components/OrgMark";
import { linkClass, navLinkClass } from "@/lib/ui";

// Loaded only when tier is "full"/"reduced" (see the conditional render
// below) -- never fetched at all for "static"-tier visitors.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

const KEYFRAMES: CameraKeyframe[] = [
  { at: 0, position: [0, 0, 6], lookAt: [0, 0, 0] },
  { at: 0.33, position: [2, 0.5, 3], lookAt: [0, 0, -4] },
  { at: 0.66, position: [-2, -0.5, 0], lookAt: [0, 0, -8] },
  { at: 1, position: [0, 0.5, -3], lookAt: [0, 0, -12] },
];

interface FlythroughProps {
  hero: ReactNode;
}

const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];

export default function Flythrough({ hero }: FlythroughProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [tier, setTier] = useState<DeviceTier | null>(null);
  // Resolved synchronously (not via framer-motion's own useReducedMotion(),
  // which returns null during an ambiguous pre-settle window and would cause
  // a brief incorrect flash) so waypoints never even attempt the scroll-linked
  // fade for a reduced-motion visitor. Deliberately independent of `tier`:
  // tier also collapses to "static" when WebGL2 is simply unavailable, which
  // must NOT suppress the waypoint fade -- only an actual reduced-motion
  // preference should. See docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md.
  const [reduceMotion, setReduceMotion] = useState(() => prefersReducedMotion());
  // IntroOverlay only needs two synchronously-available signals -- WebGL2
  // support and the reduced-motion preference -- neither of which requires
  // waiting on the async tier probe below. Gating it on `canFly` instead
  // would mount it well after first paint (the FPS probe alone takes several
  // animation frames), so a first-time visitor would see the homepage flash
  // before the intro slams over it -- the opposite of the intended ceremony.
  const [introEnabled] = useState(() => !prefersReducedMotion() && detectWebGL2());

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The CSS motion system elsewhere on the site responds to
  // prefers-reduced-motion changing mid-session instantly (it's a plain media
  // query); this keeps the scroll-linked waypoint fade in sync with that
  // instead of freezing at whatever the preference was on first mount.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mql.matches);
    // Guard for environments (jsdom test mocks, very old Safari) whose
    // MediaQueryList doesn't implement the standard listener methods --
    // real browsers always do, so this only ever no-ops in those cases.
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const canFly = tier === "full" || tier === "reduced";

  return (
    <div ref={trackRef} className="relative">
      <IntroOverlay enabled={introEnabled} />
      {canFly && tier && (
        <SceneCanvas progress={scrollYProgress} keyframes={KEYFRAMES} tier={tier} />
      )}

      <div className="relative z-10">
        <div className="min-h-screen">{hero}</div>

        {/* Progress ranges below are fractions of the WHOLE track (useScroll's
            target is this component's outer div, offset start-start/end-end),
            so they have to be re-derived whenever any section's height
            changes. Current track, in viewport units: hero ~1.5v (its content
            overflows the min-h-screen box), About 1v, Experience 1v, Contact
            2.2v (min-h-[220vh], the sticky pin's scroll room) = ~5.7v total,
            of which 4.7v is actually scrollable. That puts About's content
            centred at p ~0.27, Experience's at ~0.48, and the Contact pin's
            sticky window at p 0.745-1 -- which is what each range below is
            tuned to (a waypoint reaches full opacity at its range's midpoint;
            PinnedStatement subdivides its range across its slots). */}
        <Waypoint range={[0.18, 0.36]} progress={scrollYProgress} reduceMotion={reduceMotion} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">About</p>
          <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            {site.tagline}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
          <Link href="/about" className={`mt-6 inline-block ${linkClass}`}>
            View full profile →
          </Link>
        </Waypoint>

        <Waypoint range={[0.40, 0.56]} progress={scrollYProgress} reduceMotion={reduceMotion} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Experience</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            A working history.
          </h2>
          <ol className="mt-8 max-w-xl space-y-6">
            {EXPERIENCE_HIGHLIGHTS.map((entry) => (
              <li key={`${entry.org}-${entry.period}`} className="flex items-start gap-4">
                <span className="mt-1 shrink-0 font-mono text-sm tabular-nums text-amber">
                  {entry.number}
                </span>
                <div className="h-10 w-10 shrink-0">
                  <div className="org-mark-wrap">
                    <OrgMark org={entry.org} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold uppercase text-paper">
                    {entry.role} · {entry.org}
                  </p>
                  <p className="mt-1 text-sm text-mute">{entry.period}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
            View full timeline →
          </Link>
        </Waypoint>

        {/* Two lines, not three: a third line built from employment[0]
            ("Board Member · stuMagz") differed from site.jobTitle ("Board
            Member, stuMagz") only by its separator, so the crossfade read as
            a rendering stutter rather than a sequence -- and it duplicated a
            string the Experience waypoint above already shows. */}
        <PinnedStatement
          range={[0.72, 1]}
          progress={scrollYProgress}
          reduceMotion={reduceMotion}
          lines={[site.tagline, site.jobTitle]}
          className="py-24"
          scrollHeightClassName="min-h-[220vh]"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Contact</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            Get in touch.
          </h2>
          <p className="mt-6">
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </p>
          <ul
            aria-label="Social links"
            className="mt-6 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 font-mono text-xs uppercase tracking-widest"
          >
            {social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className={`mt-6 inline-block ${linkClass}`}>
            View full contact →
          </Link>
        </PinnedStatement>
      </div>
    </div>
  );
}
