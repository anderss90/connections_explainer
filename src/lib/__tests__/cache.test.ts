import { clearCache, getCached, setCached } from "../cache";

describe("cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("stores and retrieves cached values", () => {
    setCached("test-key", { value: 123 }, 60_000);
    expect(getCached<{ value: number }>("test-key")).toEqual({ value: 123 });
  });

  it("returns null for missing keys", () => {
    expect(getCached("missing")).toBeNull();
  });
});
