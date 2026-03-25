import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  gdeltFixture,
  iaeaRssFixture,
  ofacCsvFixture,
  opensanctionsFixture,
} from "@/lib/ingest/adapters/__fixtures__/adapter-fixtures";
import * as gdelt from "@/lib/ingest/adapters/gdelt";
import * as iaea from "@/lib/ingest/adapters/iaea";
import * as ofac from "@/lib/ingest/adapters/ofac";
import * as opensanctions from "@/lib/ingest/adapters/opensanctions";
import { fetchJson, fetchText } from "@/lib/ingest/http";

vi.mock("@/lib/ingest/http", () => ({
  fetchJson: vi.fn(),
  fetchText: vi.fn(),
}));

const fetchJsonMock = vi.mocked(fetchJson);
const fetchTextMock = vi.mocked(fetchText);

describe("adapter fixture tests", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("gdelt", () => {
    it("maps fixture articles into candidate events", async () => {
      fetchJsonMock.mockResolvedValue(gdeltFixture);

      const events = await gdelt.fetchCandidates();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "Missile attack drives new sanctions package",
        sourceKey: "gdelt_events",
        source: "Example Wire",
        sourceUrl: "https://example.com/gdelt/missile-attack",
        occurredAt: "2026-03-24T11:22:33Z",
        impactDimension: "military_conflict",
        evidenceType: "structured",
        rawRegion: "US",
      });
      expect(events[0]?.confidence).toBe(0.85);
      expect(fetchJsonMock).toHaveBeenCalledOnce();
    });

    it("returns an empty array when the upstream fetch fails", async () => {
      fetchJsonMock.mockRejectedValue(new Error("network down"));

      await expect(gdelt.fetchCandidates()).resolves.toEqual([]);
    });
  });

  describe("iaea", () => {
    it("parses RSS fixture into nuclear candidate events", async () => {
      fetchTextMock.mockResolvedValue(iaeaRssFixture);

      const events = await iaea.fetchCandidates();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "IAEA reports safeguards update at nuclear facility",
        sourceKey: "iaea_news",
        source: "IAEA",
        sourceUrl: "https://www.iaea.org/news/1",
        occurredAt: "2026-03-24T09:30:00.000Z",
        impactDimension: "nuclear_miscalculation",
        evidenceType: "official",
        rawCategory: "Safeguards mission and verification details",
      });
      expect(events[0]?.confidence).toBe(0.8);
    });

    it("returns an empty array for an RSS payload with no valid items", async () => {
      fetchTextMock.mockResolvedValue("<rss><channel><item><title></title></item></channel></rss>");

      await expect(iaea.fetchCandidates()).resolves.toEqual([]);
    });
  });

  describe("ofac", () => {
    it("builds sanctions events from CSV fixture rows", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));
      fetchTextMock.mockResolvedValue(ofacCsvFixture);

      const events = await ofac.fetchCandidates();

      expect(events).toHaveLength(3);
      expect(events[0]).toMatchObject({
        title: "OFAC SDN update: SDN_NAME",
        sourceKey: "ofac_sdn",
        source: "OFAC",
        sourceUrl:
          "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV",
        occurredAt: "2026-03-25T00:00:00.000Z",
        impactDimension: "trade_sanctions",
        evidenceType: "structured",
        rawCategory: "PROGRAM",
        rawRegion: "SDN_TYPE",
        confidence: 0.9,
      });
      expect(events[1]).toMatchObject({
        title: "OFAC SDN update: ALPHA TRADING LLC",
        rawCategory: "RUSSIA-EO14024",
        rawRegion: "Entity",
      });
    });

    it("returns an empty array when the CSV fetch fails", async () => {
      fetchTextMock.mockRejectedValue(new Error("timeout"));

      await expect(ofac.fetchCandidates()).resolves.toEqual([]);
    });
  });

  describe("opensanctions", () => {
    it("maps JSONL fixture rows into sanctions events", async () => {
      fetchTextMock.mockResolvedValue(opensanctionsFixture);

      const events = await opensanctions.fetchCandidates();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "OpenSanctions target: Alpha Holdings",
        sourceKey: "opensanctions",
        source: "OpenSanctions",
        sourceUrl: "https://www.opensanctions.org/entities/Q123/",
        occurredAt: "2026-03-24T10:15:00Z",
        impactDimension: "great_power_tension",
        evidenceType: "structured",
        rawCategory: "Sanctions",
      });
      expect(events[0]?.confidence).toBe(0.75);
    });

    it("returns an empty array when all JSONL rows are unusable", async () => {
      fetchTextMock.mockResolvedValue(
        [
          JSON.stringify({ schema: "Sanctions" }),
          "not json",
        ].join("\n")
      );

      await expect(opensanctions.fetchCandidates()).resolves.toEqual([]);
    });
  });
});
