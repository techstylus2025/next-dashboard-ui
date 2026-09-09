import { describe, expect, it } from "vitest";
import { buildRoleTransition } from "../passwordManagerRole";

describe("password manager role transition", () => {
  it("builds a migration payload when a user changes role", () => {
    const result = buildRoleTransition("teacher", "admin", {
      id: "user_123",
      username: "janedoe",
      name: "Jane",
      surname: "Doe",
      email: "jane@example.com",
      address: "1 First Street",
      phone: "123456789",
      bloodType: "A+",
      sex: "FEMALE",
    });

    expect(result.shouldMigrate).toBe(true);
    expect(result.targetRole).toBe("admin");
    expect(result.createPayload).toEqual({
      id: "user_123",
      username: "janedoe",
    });
  });
});
