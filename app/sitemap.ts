import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/about", "/experience", "/contact"];
  return routes.map((route) => ({
    url: new URL(route, site.baseUrl).toString(),
    lastModified: new Date(),
  }));
}
