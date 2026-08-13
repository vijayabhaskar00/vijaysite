import { describe, expect, it } from "vitest";
import { monogramFor } from "@/lib/monogram";

describe("monogramFor", () => {
  it("uses initials of the first two words for multi-word names", () => {
    expect(monogramFor("Mahatma Gandhi Institute of Technology")).toBe("MG");
  });

  it("uses the first two letters for single-word names", () => {
    expect(monogramFor("stuMagz")).toBe("ST");
  });

  it("splits on commas and dashes as word boundaries", () => {
    expect(monogramFor("ATAL Innovation Mission, Niti Aayog – GOI")).toBe("AI");
  });
});
