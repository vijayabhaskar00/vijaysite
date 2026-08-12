import { site, social } from "@/content/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p>
        © {year} {site.name}
      </p>
      <ul aria-label="Social links">
        {social.map((item) => (
          <li key={item.href}>
            <a href={item.href} target="_blank" rel="noreferrer noopener">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
