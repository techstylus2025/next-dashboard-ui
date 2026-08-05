import { describe, expect, it } from "vitest";
import { isRecoverablePrismaError } from "../prismaError";

describe("isRecoverablePrismaError", () => {
  it("detects missing-table Prisma errors", () => {
    const error = { code: "P2021", message: "The table does not exist" };
    expect(isRecoverablePrismaError(error)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    const error = new Error("Something else happened");
    expect(isRecoverablePrismaError(error)).toBe(false);
  });
});
