import { describe, expect, it } from "vitest";
import { site, nav, social } from "../site";
import { employment, credentials } from "../experience";

const FORBIDDEN = [
  "XXXXX",
  "Punctual",
  "Often people default",
  "Born in India - Proud Indian",
  "Google+",
];

describe("content integrity", () => {
  it("has no forbidden placeholder/template strings", () => {
    const blob = JSON.stringify({ site, nav, social, employment, credentials });
    for (const bad of FORBIDDEN) {
      expect(blob).not.toContain(bad);
    }
  });

  it("only ships approved social links", () => {
    expect(social).toEqual([
      { label: "Instagram", href: "https://www.instagram.com/vijayabhaskarjatoth/" },
      { label: "Facebook", href: "https://www.facebook.com/vijayabhaskarofficial" },
    ]);
  });

  it("every social and nav link is a real https or in-site path, never '#'", () => {
    for (const link of [...social, ...nav]) {
      expect(link.href).not.toBe("#");
      expect(link.href.startsWith("https://") || link.href.startsWith("/")).toBe(true);
    }
  });

  it("nav covers exactly the four shipped routes", () => {
    expect(nav.map((n) => n.href)).toEqual(["/", "/about", "/experience", "/contact"]);
  });

  it("employment and credentials only reference verified organizations", () => {
    const allowedOrgs = [
      "stuMagz",
      "Tsearch.in",
      "ATAL Innovation Mission, Niti Aayog – GOI",
      "Microsoft",
    ];
    for (const entry of [...employment, ...credentials]) {
      expect(allowedOrgs).toContain(entry.org);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("site.email and site.baseUrl are correct", () => {
    expect(site.email).toBe("me@vijayabhaskar.in");
    expect(site.baseUrl).toBe("https://vijayabhaskar.in");
  });
});
