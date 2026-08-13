import { site, social } from "@/content/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t-2 border-night">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-ink/60">{site.location}</p>
        <ul
          aria-label="Social links"
          className="flex list-none flex-wrap gap-x-7 gap-y-2 p-0 font-mono text-xs uppercase tracking-[0.15em]"
        >
          {social.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink/70 transition-colors hover:text-terracotta focus-visible:text-terracotta focus-visible:underline focus-visible:outline-none"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-ink/10 px-6 py-4 text-center font-mono text-[11px] uppercase tracking-widest text-ink/40 sm:px-8">
        © {year} {site.name}
      </div>
    </footer>
  );
}
