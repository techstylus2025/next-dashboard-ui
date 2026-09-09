import { describe, expect, it } from "vitest";
import { teacherSchema, subjectSchema } from "./formValidationSchemas";

describe("teacherSchema", () => {
  it("requires a valid email address", () => {
    const result = teacherSchema.safeParse({
      username: "teacher1",
      password: "StrongPass123!",
      name: "Ada",
      surname: "Lovelace",
      email: "",
      phone: "0240000000",
      address: "123 Main Street",
      bloodType: "O+",
      birthday: "1990-01-01",
      sex: "FEMALE",
      subjects: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected validation to fail for empty email");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["email"] }),
      ])
    );
  });
});

describe("subjectSchema", () => {
  it("requires a grading level for each subject", () => {
    const result = subjectSchema.safeParse({
      name: "Mathematics",
      gradeId: 0,
      teachers: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected validation to fail for missing grading level");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["gradeId"] }),
      ])
    );
  });
});
