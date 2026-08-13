import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatBand from "../StatBand";
import { stats } from "@/content/site";

describe("StatBand", () => {
  it("renders every stat's value and label", () => {
    render(<StatBand />);
    for (const stat of stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });
});
