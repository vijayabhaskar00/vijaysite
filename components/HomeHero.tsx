"use client";

import { useRef, type PointerEvent } from "react";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import Marquee from "@/components/Marquee";
import Tilt from "@/components/motion/Tilt";
import Magnetic from "@/components/motion/Magnetic";
import LineReveal from "@/components/motion/LineReveal";
import { useCanAnimate, fadeUpItem, staggerContainer, POINTER_SPRING } from "@/lib/motion";
import { primaryButtonClass } from "@/lib/ui";

// How far each hero layer drifts from the pointer's center-relative
// position, in px -- the photo moves more than the heading text, so
// hovering the hero reads as real depth rather than one flat scene sliding
// as a unit. The scene behind the hero is now the site-wide 3D ClayField
// (see components/three/), so there is no decorative SVG layer here.
const PHOTO_DEPTH = 10;
const HEADING_DEPTH = 4;

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

  const cta = (
    <Magnetic className="mt-8">
      <Link href="/contact" className={`group ${primaryButtonClass}`}>
        Let&rsquo;s talk
        <span aria-hidden="true" className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">
          →
        </span>
      </Link>
    </Magnetic>
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
          {pill}
          {heading}
          {descriptionRow}
          {cta}
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
        <motion.div style={{ y: exitY, opacity: exitOpacity, scale: exitScale }}>
          <motion.div variants={fadeUpItem}>{pill}</motion.div>
          <motion.div variants={fadeUpItem} style={{ x: headingX }}>
            {heading}
          </motion.div>
          <motion.div variants={fadeUpItem}>{descriptionRow}</motion.div>
          <motion.div variants={fadeUpItem}>{cta}</motion.div>
        </motion.div>
      </section>
      <motion.div variants={fadeUpItem}>{marquee}</motion.div>
    </motion.div>
  );
}
