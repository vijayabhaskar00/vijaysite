import Link from "next/link";
import { nav, site } from "@/content/site";
import { linkClass } from "@/lib/ui";

export default function Header() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <Link
          href="/"
          className="rounded-sm font-display text-xl font-semibold text-ink transition-colors hover:text-terracotta focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          {site.shortName}
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-x-6 gap-y-2 p-0">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
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
