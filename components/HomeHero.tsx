"use client";

import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import Marquee from "@/components/Marquee";
import Tilt from "@/components/motion/Tilt";
import LineReveal from "@/components/motion/LineReveal";
import { useCanAnimate, fadeUpItem, staggerContainer, POINTER_SPRING } from "@/lib/motion";

// How far each hero layer drifts from the pointer's center-relative
// position, in px -- the blob (purely decorative) moves the most, the
// photo a middle amount, the heading text the least, so hovering the hero
// reads as real depth rather than one flat scene sliding as a unit.
const BLOB_DEPTH = 18;
const PHOTO_DEPTH = 10;
const HEADING_DEPTH = 4;

interface ParallaxProps {
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

/** Two overlapping soft blobs behind the hero portrait -- the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. Drifts
 * subtly as the page scrolls past the hero (scroll-linked) and as the
 * pointer moves across the hero (parallaxX/parallaxY, from the parent's
 * shared pointer spring) -- inert entirely under reduced motion, since the
 * style is only attached when useCanAnimate() is true. */
function ClayBlobBackdrop({ parallaxX, parallaxY }: ParallaxProps) {
  const canAnimate = useCanAnimate();
  const { scrollY } = useScroll();
  const scrollDriftY = useTransform(scrollY, [0, 600], [0, 40]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.08]);
  const y = useTransform([scrollDriftY, parallaxY], ([drift, pointer]: number[]) => drift + pointer);

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 opacity-90 sm:-right-14 sm:-top-14 sm:h-48 sm:w-48 lg:-right-16 lg:-top-16 lg:h-56 lg:w-56"
      style={canAnimate ? { x: parallaxX, y, scale } : undefined}
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
  const heroRef = useRef<HTMLElement>(null);

  // Raw pointer position (-0.5 to 0.5 across the hero's own bounds),
  // spring-damped through POINTER_SPRING, then scaled per layer below
  // into each element's own depth.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, POINTER_SPRING);
  const springY = useSpring(pointerY, POINTER_SPRING);

  const blobX = useTransform(springX, (value) => value * BLOB_DEPTH);
  const blobY = useTransform(springY, (value) => value * BLOB_DEPTH);
  const photoX = useTransform(springX, (value) => value * PHOTO_DEPTH);
  const photoY = useTransform(springY, (value) => value * PHOTO_DEPTH);
  const headingX = useTransform(springX, (value) => value * HEADING_DEPTH);

  // Scroll-linked exit: as the hero itself scrolls out of view (not the
  // whole page), its content recedes -- translates up, fades, and scales
  // down slightly. The page keeps scrolling at the user's own pace the
  // entire time; this only changes how the hero's own content responds to
  // that scroll, it never takes control of it. `target` is only passed
  // once canAnimate is true (the render pass where heroRef is actually
  // attached to the <section>, since the plain branch never sets the ref
  // at all) -- passing an unattached ref object as `target` trips Framer
  // Motion's "ref defined but not hydrated" invariant.
  const { scrollYProgress } = useScroll(
    canAnimate ? { target: heroRef, offset: ["start start", "end start"] } : undefined
  );
  const exitY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const exitOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const exitScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const node = heroRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const pill = (
    <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
      {site.location} — {site.tagline}
    </p>
  );

  const heading = (
    <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
      <LineReveal text={site.name} />
    </h1>
  );

  const descriptionRow = (
    <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
      <motion.div style={canAnimate ? { x: photoX, y: photoY } : undefined}>
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
      </motion.div>
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
          <ClayBlobBackdrop parallaxX={blobX} parallaxY={blobY} />
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
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <ClayBlobBackdrop parallaxX={blobX} parallaxY={blobY} />
        <motion.div style={{ y: exitY, opacity: exitOpacity, scale: exitScale }}>
          <motion.div variants={fadeUpItem}>{pill}</motion.div>
          <motion.div variants={fadeUpItem} style={{ x: headingX }}>
            {heading}
          </motion.div>
          <motion.div variants={fadeUpItem}>{descriptionRow}</motion.div>
        </motion.div>
      </section>
      <motion.div variants={fadeUpItem}>{marquee}</motion.div>
    </motion.div>
  );
}
