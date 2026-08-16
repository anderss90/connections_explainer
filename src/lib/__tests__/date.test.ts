import { getMsUntilMidnightET, getTodayInET, formatDisplayDate } from "../date";

describe("date utilities", () => {
  it("formats today in ET as YYYY-MM-DD", () => {
    const date = new Date("2026-08-16T06:00:00.000Z");
    expect(getTodayInET(date)).toBe("2026-08-16");
  });

  it("formats display date for readers", () => {
    expect(formatDisplayDate("2026-08-16")).toBe("Sunday, August 16, 2026");
  });

  it("returns positive milliseconds until midnight ET", () => {
    const ms = getMsUntilMidnightET(new Date("2026-08-16T15:00:00.000Z"));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });
});
