"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { resolveDeviceTier, type DeviceTier } from "./deviceTier";
import IntroOverlay from "./IntroOverlay";
import Waypoint from "./Waypoint";
import type { CameraKeyframe } from "./FlyPath";
import { site, social } from "@/content/site";
import { employment } from "@/content/experience";
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

export default function Flythrough({ hero }: FlythroughProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canFly = tier === "full" || tier === "reduced";

  return (
    <div ref={trackRef} className="relative">
      <IntroOverlay enabled={canFly} />
      {canFly && tier && (
        <SceneCanvas progress={scrollYProgress} keyframes={KEYFRAMES} tier={tier} />
      )}

      <div className="relative z-10">
        <div className="min-h-screen">{hero}</div>

        <Waypoint range={[0.25, 0.45]} progress={scrollYProgress} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">About</p>
          <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            {site.tagline}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
          <Link href="/about" className={`mt-6 inline-block ${linkClass}`}>
            View full profile →
          </Link>
        </Waypoint>

        <Waypoint range={[0.55, 0.75]} progress={scrollYProgress} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Experience</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            {employment[0].role} · {employment[0].org}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            {employment[0].description}
          </p>
          <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
            View full timeline →
          </Link>
        </Waypoint>

        <Waypoint range={[0.85, 1]} progress={scrollYProgress} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Contact</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            Get in touch.
          </h2>
          <p className="mt-6">
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </p>
          <ul className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-xs uppercase tracking-widest">
            {social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </Waypoint>
      </div>
    </div>
  );
}
