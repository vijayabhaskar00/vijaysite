import { describe, expect, it } from "vitest";
import { buildMetadata, personJsonLd } from "../seo";

describe("buildMetadata", () => {
  it("appends the site name to the title", () => {
    const meta = buildMetadata({
      title: "About",
      description: "Bio.",
      path: "/about",
    });
    expect(meta.title).toBe("About | Vijaya Bhaskar Jatoth");
  });

  it("builds an absolute canonical URL from the path", () => {
    const meta = buildMetadata({
      title: "About",
      description: "Bio.",
      path: "/about",
    });
    expect(meta.alternates?.canonical).toBe("https://vijayabhaskar.in/about");
  });
});

describe("personJsonLd", () => {
  it("is a schema.org Person referencing only approved social links", () => {
    const json = personJsonLd();
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe("Vijaya Bhaskar Jatoth");
    expect(json.sameAs).toEqual([
      "https://www.instagram.com/vijayabhaskarjatoth/",
      "https://www.facebook.com/vijayabhaskarofficial",
    ]);
  });
});
