import Link from "next/link";
import { nav, site } from "@/content/site";
import { navLinkClass } from "@/lib/ui";

export default function Header() {
  return (
    <header className="border-b-2 border-night">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <Link
          href="/"
          className="rounded-sm font-display text-2xl font-semibold text-ink transition-colors hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          {site.shortName}
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-x-7 gap-y-2 p-0 font-mono text-xs uppercase tracking-[0.15em]">
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
