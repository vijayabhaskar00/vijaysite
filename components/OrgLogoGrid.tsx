"use client";

import { motion } from "framer-motion";
import { orgNames } from "@/content/site";
import OrgMark from "@/components/OrgMark";
import Tilt from "@/components/motion/Tilt";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

function Card({ org }: { org: string }) {
  return (
    <div className="flex h-full flex-col items-center rounded-[2rem] bg-surface p-5 text-center shadow-clay-raised">
      <OrgMark org={org} className="h-16 w-16" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">{org}</p>
    </div>
  );
}

export default function OrgLogoGrid() {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {orgNames.map((org) => (
          <Tilt key={org} className="h-full">
            <Card org={org} />
          </Tilt>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      variants={staggerContainer(60)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {orgNames.map((org) => (
        <motion.div key={org} variants={fadeUpItem}>
          <Tilt className="h-full">
            <Card org={org} />
          </Tilt>
        </motion.div>
      ))}
    </motion.div>
  );
}
