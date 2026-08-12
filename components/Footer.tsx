import { site, social } from "@/content/site";
import { linkClass } from "@/lib/ui";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-ink/10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-ink/70">
          © {year} {site.name}
        </p>
        <ul aria-label="Social links" className="flex list-none gap-x-6 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={linkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
