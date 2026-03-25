import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONFIDENCE_BY_KIND,
  SOURCE_CONFIGS,
  getDefaultConfidenceForSource,
  getSourceByKey,
  getSourcesForDimension,
} from "@/lib/ingest/sources";
import type { GdiDimensionKey } from "@/lib/types";

describe("sources registry", () => {
  it("maps a dimension to the expected source keys", () => {
    const sourceKeys = getSourcesForDimension("trade_sanctions").map((source) => source.key);

    expect(sourceKeys).toContain("ofac_sdn");
    expect(sourceKeys).toContain("wto_news");
    expect(sourceKeys).toContain("gnews_api");
    expect(sourceKeys).not.toContain("iaea_news");
  });

  it("returns the default confidence for a known source", () => {
    const source = getSourceByKey("ofac_sdn");

    expect(source).toBeDefined();
    expect(getDefaultConfidenceForSource("ofac_sdn")).toBe(
      DEFAULT_CONFIDENCE_BY_KIND[source!.kind]
    );
  });

  it("keeps source-to-dimension mappings consistent with the registry", () => {
    const dimensions: GdiDimensionKey[] = [
      "military_conflict",
      "great_power_tension",
      "trade_sanctions",
      "energy_shipping",
      "nuclear_miscalculation",
    ];

    for (const dimension of dimensions) {
      const expectedKeys = SOURCE_CONFIGS.filter((source) => source.dimensions.includes(dimension)).map(
        (source) => source.key
      );

      expect(getSourcesForDimension(dimension).map((source) => source.key)).toEqual(expectedKeys);
    }
  });

  it("returns the configured default confidence for every registered source kind", () => {
    for (const source of SOURCE_CONFIGS) {
      expect(getDefaultConfidenceForSource(source.key)).toBe(DEFAULT_CONFIDENCE_BY_KIND[source.kind]);
    }
  });

  it("returns undefined default confidence for an unknown source", () => {
    expect(getDefaultConfidenceForSource("missing-source")).toBeUndefined();
  });
});
