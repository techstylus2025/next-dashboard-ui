import { describe, expect, it } from "vitest";
import { calculateTermDays } from "../academicYearUtils";

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
