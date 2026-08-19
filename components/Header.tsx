"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { nav, site } from "@/content/site";
import Magnetic from "@/components/motion/Magnetic";
import { navLinkClass } from "@/lib/ui";
import { useCanAnimate } from "@/lib/motion";

/** Site header. A client component (unlike Footer, which stays
 * server-rendered) so it can know the current route via usePathname() and
 * highlight which nav pill is active -- something a Server Component
 * shared by every route through the root layout can't determine on its
 * own. The active pill's fill is unconditional (present even with JS
 * disabled or under reduced motion, since pathname is known at render
 * time for every statically exported route); only the *sliding* layoutId
 * morph between pills on navigation is gated behind useCanAnimate(). */
export default function Header() {
  // next.config.mjs sets trailingSlash: true, so usePathname() returns
  // "/about/" (not "/about") for every route except the root -- normalize
  // before comparing against nav[].href (which never has a trailing
  // slash), or every non-home page's active state silently never matches.
  const rawPathname = usePathname();
  const pathname = rawPathname && rawPathname !== "/" ? rawPathname.replace(/\/$/, "") : rawPathname;
  const canAnimate = useCanAnimate();

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <Magnetic>
          <Link
            href="/"
            className="inline-block rounded-full px-2 py-1 font-display text-2xl font-extrabold text-ink transition-colors duration-300 hover:text-clay-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40"
          >
            {site.shortName}
          </Link>
        </Magnetic>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-2 p-0">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="relative">
                  {isActive &&
                    (canAnimate ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-full bg-clay-amber"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-clay-amber" />
                    ))}
                  <Magnetic>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={navLinkClass(isActive)}
                    >
                      {item.label}
                    </Link>
                  </Magnetic>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
