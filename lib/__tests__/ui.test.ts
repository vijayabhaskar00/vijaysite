import { describe, expect, it } from "vitest";
import { navLinkClass } from "../ui";

describe("navLinkClass", () => {
  // Regression test: Header renders the active-page pill as a separate
  // `absolute inset-0` sibling BEHIND this link, for the sliding layoutId
  // morph between pages (see Header.tsx). A positioned sibling with
  // z-index:auto paints above non-positioned in-flow content regardless
  // of DOM order -- without its own explicit stacking context, the link
  // rendered UNDER the pill and its label text was completely invisible,
  // confirmed live with Playwright (elementFromPoint at the link's center
  // returned the pill, not the link). `relative z-10` is what fixes it.
  it("gives every nav link its own explicit stacking context above the active pill's z-index:auto", () => {
    expect(navLinkClass()).toContain("relative");
    expect(navLinkClass()).toContain("z-10");
    expect(navLinkClass(true)).toContain("relative");
    expect(navLinkClass(true)).toContain("z-10");
  });

  it("keeps filling the active pill's text color, independent of the stacking fix", () => {
    // Split into tokens rather than substring-matching "text-surface" --
    // the inactive variant legitimately contains it as part of
    // "hover:text-surface"/"focus-visible:text-surface", which a plain
    // .toContain() would wrongly flag as the unconditional active state.
    expect(navLinkClass(true).split(/\s+/)).toContain("text-surface");
    expect(navLinkClass(false).split(/\s+/)).not.toContain("text-surface");
  });
});
