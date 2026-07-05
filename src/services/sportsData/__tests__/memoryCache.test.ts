import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCache, getFromCache, setCache, buildCacheKey } from "../cache/memoryCache";

afterEach(() => {
  clearCache();
  vi.useRealTimers();
});

describe("memoryCache", () => {
  it("returns cached data within the TTL window", () => {
    setCache("key-1", { hello: "world" }, 30);
    expect(getFromCache("key-1")).toEqual({ hello: "world" });
  });

  it("returns null for a key that was never set", () => {
    expect(getFromCache("missing-key")).toBeNull();
  });

  it("expires entries after the TTL elapses", () => {
    vi.useFakeTimers();
    setCache("expiring-key", { value: 1 }, 10);
    vi.advanceTimersByTime(11_000);
    expect(getFromCache("expiring-key")).toBeNull();
  });

  it("clears a single key without affecting others", () => {
    setCache("a", 1);
    setCache("b", 2);
    clearCache("a");
    expect(getFromCache("a")).toBeNull();
    expect(getFromCache("b")).toBe(2);
  });

  it("builds a deterministic key regardless of param order", () => {
    const key1 = buildCacheKey("standings", { competitionId: "x", season: 2026 });
    const key2 = buildCacheKey("standings", { season: 2026, competitionId: "x" });
    expect(key1).toBe(key2);
  });
});
