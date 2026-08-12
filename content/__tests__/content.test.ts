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

  it("employment and credentials descriptions do not introduce unapproved organizations", () => {
    // entry.org is checked against the allowlist above, but that check does
    // nothing to guard free-text `description` fields — a prior whole-branch
    // review found this was exactly the gap that let an org name ship
    // undetected in descriptive text. This scans description text for
    // legacy/decommissioned platforms and other organizations from the old
    // Blogger template that must never reappear.
    //
    // NOTE: "Manipal University" already appears in the stuMagz employment
    // description (content/experience.ts) and is not part of the four
    // verified organizations above. Per this fix wave's scope, content
    // *facts* are out of bounds (a separate, pending decision with the site
    // owner covers whether to formally verify/allowlist it or remove it), so
    // it is intentionally excluded from this check rather than silently
    // allowlisted or deleted.
    const knownPendingMentions = ["Manipal University"];
    const unapprovedOrgNames = [
      "Twitter",
      "LinkedIn",
      "Behance",
      "YouTube",
      "Google+",
      "Google",
      "Blogger",
      "Websoham",
      "Gooyaabi",
    ];
    for (const entry of [...employment, ...credentials]) {
      let description = entry.description;
      for (const pending of knownPendingMentions) {
        description = description.split(pending).join("");
      }
      for (const bad of unapprovedOrgNames) {
        expect(description).not.toContain(bad);
      }
    }
  });

  it("site.email and site.baseUrl are correct", () => {
    expect(site.email).toBe("me@vijayabhaskar.in");
    expect(site.baseUrl).toBe("https://vijayabhaskar.in");
  });

  it("has no phone-number-like or date-of-birth-like strings", () => {
    // Phone numbers were never meant to ship (spec: "no phone number or DOB
    // published"). Walk every string leaf in the content modules and check
    // it against a phone-ish pattern and the site's old literal DOB string.
    const PHONE_LIKE = /\+?\d[\d\s\-()]{7,}\d/;
    const OLD_DOB = "01 AUG 1992";

    function collectStrings(value: unknown, out: string[]): void {
      if (typeof value === "string") {
        out.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) collectStrings(item, out);
      } else if (value && typeof value === "object") {
        for (const v of Object.values(value)) collectStrings(v, out);
      }
    }

    const strings: string[] = [];
    collectStrings({ site, nav, social, employment, credentials }, strings);

    for (const str of strings) {
      expect(str).not.toContain(OLD_DOB);
      expect(PHONE_LIKE.test(str)).toBe(false);
    }
  });
});
