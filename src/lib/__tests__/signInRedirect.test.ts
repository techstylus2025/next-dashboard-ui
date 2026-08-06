import { describe, expect, it } from "vitest";
import { getRoleRedirectPath, normalizeRole } from "../signInRedirect";

describe("normalizeRole", () => {
  it("normalizes role values to lowercase and trims whitespace", () => {
    expect(normalizeRole(" Teacher ")).toBe("teacher");
    expect(normalizeRole("ADMIN")).toBe("admin");
  });

  it("returns null for empty or unsupported values", () => {
    expect(normalizeRole("   ")).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
    expect(normalizeRole(null)).toBeNull();
  });
});

describe("getRoleRedirectPath", () => {
  it("prefers the server role when both are available", () => {
    expect(getRoleRedirectPath("parent", "teacher")).toBe("/teacher");
  });

  it("falls back to the admin dashboard when no role is known", () => {
    expect(getRoleRedirectPath(undefined, null)).toBe("/admin");
  });
});
