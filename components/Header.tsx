import Link from "next/link";
import { nav, site } from "@/content/site";
import { navLinkClass } from "@/lib/ui";

export default function Header() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <Link
          href="/"
          className="inline-block rounded-full px-2 py-1 font-display text-2xl font-extrabold text-ink transition-colors duration-300 hover:text-clay-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40"
        >
          {site.shortName}
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-2 p-0">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
