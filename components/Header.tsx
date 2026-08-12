import Link from "next/link";
import { nav, site } from "@/content/site";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        {site.shortName}
      </Link>
      <nav aria-label="Primary">
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
