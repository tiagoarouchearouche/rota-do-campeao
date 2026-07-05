import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getStandings, getFixtures, getCompetitions } from "../sportsDataService";
import { clearCache } from "../cache/memoryCache";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  clearCache();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearCache();
});

describe("sportsDataService fallback behavior", () => {
  it("defaults to mock when SPORTS_DATA_PROVIDER is not set", async () => {
    delete process.env.SPORTS_DATA_PROVIDER;
    const result = await getStandings("brasileirao-serie-a", true);
    expect(result.isMock).toBe(true);
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("falls back to mock when football-data mode has no API key configured", async () => {
    process.env.SPORTS_DATA_PROVIDER = "football-data";
    delete process.env.FOOTBALL_DATA_KEY;
    const result = await getStandings("brasileirao-serie-a", true);
    expect(result.isMock).toBe(true);
    expect(result.source).toBe("mock");
    expect(result.warning).toBeTruthy();
  });

  it("falls back to mock for a competition that still needs code mapping", async () => {
    process.env.SPORTS_DATA_PROVIDER = "football-data";
    process.env.FOOTBALL_DATA_KEY = "fake-key-for-test";
    const result = await getFixtures("libertadores", true);
    expect(result.isMock).toBe(true);
    expect(result.warning).toContain("não possui código confirmado");
  });

  it("treats an unrecognized SPORTS_DATA_PROVIDER value as mock", async () => {
    process.env.SPORTS_DATA_PROVIDER = "api-football";
    const result = await getStandings("premier-league", true);
    expect(result.isMock).toBe(true);
    expect(result.source).toBe("mock");
  });

  it("never throws and always returns a valid envelope shape", async () => {
    process.env.SPORTS_DATA_PROVIDER = "football-data";
    const result = await getStandings("premier-league", true);
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("source");
    expect(result).toHaveProperty("isMock");
    expect(result).toHaveProperty("updatedAt");
  });

  it("returns the competition registry regardless of provider mode when no key is configured", async () => {
    process.env.SPORTS_DATA_PROVIDER = "mock";
    delete process.env.FOOTBALL_DATA_KEY;
    const result = await getCompetitions();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.isMock).toBe(true);
  });
});
