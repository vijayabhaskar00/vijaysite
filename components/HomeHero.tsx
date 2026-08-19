"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SplitText from "@/components/SplitText";
import Marquee from "@/components/Marquee";
import Tilt from "@/components/motion/Tilt";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

/** Two overlapping soft blobs behind the hero portrait -- the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. Drifts
 * subtly as the page scrolls past the hero (scroll-linked, not an
 * autonomous loop -- inert entirely under reduced motion, since the
 * transform values are only attached when useCanAnimate() is true). */
function ClayBlobBackdrop() {
  const canAnimate = useCanAnimate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 40]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.08]);

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 opacity-90 sm:-right-14 sm:-top-14 sm:h-48 sm:w-48 lg:-right-16 lg:-top-16 lg:h-56 lg:w-56"
      style={canAnimate ? { y, scale } : undefined}
    >
      <path
        fill="#FBE0C4"
        d="M281,305Q246,360,183,347Q120,334,88,281Q56,228,80,169Q104,110,163,86Q222,62,272,101Q322,140,323,199Q324,258,281,305Z"
      />
      <path
        fill="#FBE1E9"
        opacity="0.8"
        d="M255,120Q270,180,235,220Q200,260,150,245Q100,230,90,175Q80,120,125,90Q170,60,215,80Q260,100,255,120Z"
      />
    </motion.svg>
  );
}

export default function HomeHero() {
  const canAnimate = useCanAnimate();

  const pill = (
    <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
      {site.location} — {site.tagline}
    </p>
  );

  const heading = (
    <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
      <SplitText text={site.name} baseDelayMs={80} staggerMs={18} />
    </h1>
  );

  const descriptionRow = (
    <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
      <Tilt>
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
          loading="eager"
          className="h-28 w-28 shrink-0 md:h-32 md:w-32"
        />
      </Tilt>
    </div>
  );

  const marquee = (
    <Marquee
      items={orgNames}
      className="rounded-full bg-surface py-4 text-sm font-semibold text-mute shadow-clay-raised"
    />
  );

  if (!canAnimate) {
    return (
      <>
        <section className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32">
          <ClayBlobBackdrop />
          {pill}
          {heading}
          {descriptionRow}
        </section>
        {marquee}
      </>
    );
  }

  return (
    <motion.div variants={staggerContainer(160)} initial="hidden" animate="visible">
      <section className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32">
        <ClayBlobBackdrop />
        <motion.div variants={fadeUpItem}>{pill}</motion.div>
        <motion.div variants={fadeUpItem}>{heading}</motion.div>
        <motion.div variants={fadeUpItem}>{descriptionRow}</motion.div>
      </section>
      <motion.div variants={fadeUpItem}>{marquee}</motion.div>
    </motion.div>
  );
}
