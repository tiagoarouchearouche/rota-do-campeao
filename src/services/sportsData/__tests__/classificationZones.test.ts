import { describe, expect, it } from "vitest";
import { getZoneBand } from "../calculations/classificationZones";
import type { Competition } from "../types";

const brasileirao: Competition = {
  id: "brasileirao-serie-a",
  name: "Brasileirão Série A",
  type: "league",
  provider: "mock",
  season: 2026,
  hasRelegation: true,
  relegationSpots: 4,
  qualificationSpots: 6,
  titleSpots: 1,
};

const genericLeague: Competition = {
  id: "test-league",
  name: "Liga de Teste",
  type: "league",
  provider: "mock",
  season: 2026,
  hasRelegation: true,
  relegationSpots: 2,
  qualificationSpots: 2,
  titleSpots: 1,
};

describe("getZoneBand", () => {
  it("places positions 1-4 in Libertadores for BSA", () => {
    expect(getZoneBand(1, 20, brasileirao)?.tone).toBe("libertadores");
    expect(getZoneBand(4, 20, brasileirao)?.tone).toBe("libertadores");
  });

  it("places positions 5-6 in the Libertadores playoff for BSA", () => {
    expect(getZoneBand(5, 20, brasileirao)?.tone).toBe("pre-libertadores");
    expect(getZoneBand(6, 20, brasileirao)?.tone).toBe("pre-libertadores");
  });

  it("places positions 7-12 in Sul-Americana for BSA", () => {
    expect(getZoneBand(7, 20, brasileirao)?.tone).toBe("sula");
    expect(getZoneBand(12, 20, brasileirao)?.tone).toBe("sula");
  });

  it("places the bottom relegationSpots teams in relegation for BSA", () => {
    expect(getZoneBand(17, 20, brasileirao)?.tone).toBe("relegation");
    expect(getZoneBand(20, 20, brasileirao)?.tone).toBe("relegation");
  });

  it("returns null for mid-table BSA positions", () => {
    expect(getZoneBand(14, 20, brasileirao)).toBeNull();
  });

  it("falls back to generic qualification/relegation banding for other competitions", () => {
    expect(getZoneBand(1, 20, genericLeague)?.tone).toBe("libertadores");
    expect(getZoneBand(19, 20, genericLeague)?.tone).toBe("relegation");
    expect(getZoneBand(10, 20, genericLeague)).toBeNull();
  });
});
