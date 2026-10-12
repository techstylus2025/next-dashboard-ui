import { describe, expect, it } from "vitest";
import { calculateTermDays, calculateTermWeek } from "../academicYearUtils";

describe("calculateTermDays", () => {
  it("counts Monday-to-Friday working days and subtracts holidays", () => {
    expect(calculateTermDays("2025-01-06", "2025-01-10", 2)).toBe(3);
  });

  it("returns zero when dates are invalid", () => {
    expect(calculateTermDays("", "2025-01-10", 1)).toBe(0);
  });

  it("counts inclusive of the end date when the range ends on a weekday", () => {
    expect(calculateTermDays("2025-01-06", "2025-01-08", 0)).toBe(3);
  });
});

describe("calculateTermWeek", () => {
  it("starts a new term week on Monday even when the term starts midweek", () => {
    expect(calculateTermWeek("2026-09-09", "2026-12-18", new Date(2026, 9, 12))).toBe(6);
  });

  it("clamps dates before and after the term to the first and last week", () => {
    expect(calculateTermWeek("2026-09-09", "2026-10-02", new Date(2026, 8, 1))).toBe(1);
    expect(calculateTermWeek("2026-09-09", "2026-10-02", new Date(2026, 9, 12))).toBe(4);
  });

  it("returns null for invalid or reversed term dates", () => {
    expect(calculateTermWeek("not-a-date", "2026-10-02", new Date(2026, 8, 14))).toBeNull();
    expect(calculateTermWeek("2026-10-02", "2026-09-09", new Date(2026, 8, 14))).toBeNull();
  });
});
