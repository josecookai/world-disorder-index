import { describe, expect, it } from "vitest";

import { DIMENSION_KEYWORDS } from "@/lib/ingest/keywords";

describe("dimension keywords", () => {
  it("defines keyword lists for every dimension", () => {
    expect(Object.keys(DIMENSION_KEYWORDS)).toEqual([
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ]);
  });

  it("keeps representative keywords for classification", () => {
    expect(DIMENSION_KEYWORDS.trade_sanctions).toContain("tariff");
    expect(DIMENSION_KEYWORDS.energy_shipping).toContain("tanker");
    expect(DIMENSION_KEYWORDS.nuclear_miscalculation).toContain("uranium enrichment");
  });
});
