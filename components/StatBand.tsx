"use client";

import { motion } from "framer-motion";
import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

const ACCENTS = [
  { bg: "bg-clay-amber-light", text: "text-clay-amber" },
  { bg: "bg-clay-teal-light", text: "text-clay-teal" },
  { bg: "bg-clay-pink-light", text: "text-clay-pink" },
  { bg: "bg-clay-lavender-light", text: "text-clay-lavender" },
];

function Tile({ label, value, index }: { label: string; value: string; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <>
      <p className={`font-display text-3xl font-extrabold tabular-nums ${accent.text} sm:text-4xl`}>
        <StatCounter value={value} />
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/70">{label}</p>
    </>
  );
}

export default function StatBand() {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
          >
            <Tile label={stat.label} value={stat.value} index={index} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      variants={staggerContainer(80)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={fadeUpItem}
          className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
        >
          <Tile label={stat.label} value={stat.value} index={index} />
        </motion.div>
      ))}
    </motion.div>
  );
}
