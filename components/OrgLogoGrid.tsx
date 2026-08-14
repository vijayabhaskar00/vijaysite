"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { orgNames } from "@/content/site";
import { orgLogos } from "@/content/orgLogos";
import { resolveAssetPath } from "@/lib/assetPath";
import OrgMark from "@/components/OrgMark";
import { prefersReducedMotion, resolveDeviceTier, type DeviceTier } from "@/components/motion/deviceTier";

// The WebGL distortion layer is only ever mounted for "full"-tier visitors
// (see below), so it's kept out of every other visitor's bundle entirely.
const OrgMarkShader = dynamic(() => import("@/components/motion/OrgMarkShader"), { ssr: false });

export default function OrgLogoGrid() {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [reduceMotion, setReduceMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mql.matches);
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const shaderEnabled = tier === "full" && !reduceMotion;

  return (
    <div
      className="org-orbit grid grid-cols-2 gap-4 sm:grid-cols-4"
      style={{ "--count": orgNames.length } as React.CSSProperties}
    >
      {orgNames.map((org, index) => {
        const logoSrc = orgLogos[org];
        return (
          <div key={org} className="org-orbit-item" style={{ "--i": index } as React.CSSProperties}>
            <div className="org-card group">
              <div className="org-mark-wrap">
                <OrgMark org={org} />
                {shaderEnabled && logoSrc && <OrgMarkShader src={resolveAssetPath(logoSrc)} />}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-mute">{org}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
