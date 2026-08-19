import { site, social } from "@/content/site";
import { navLinkClass } from "@/lib/ui";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-20 mt-24 border-t border-mute/20">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-mute">{site.location}</p>
        <ul aria-label="Social links" className="flex list-none flex-wrap gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-mute/20 px-6 py-4 text-center text-xs text-mute sm:px-8">
        © {year} {site.name}
      </div>
    </footer>
  );
}
