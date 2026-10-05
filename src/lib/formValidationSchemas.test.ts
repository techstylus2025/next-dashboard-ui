import { describe, expect, it } from "vitest";
import { teacherSchema, subjectSchema } from "./formValidationSchemas";

describe("teacherSchema", () => {
  const validTeacher = {
    username: "teacher1",
    password: "StrongPass123!",
    name: "Ada",
    surname: "Lovelace",
    email: "ada@example.com",
    phone: "0240000000",
    address: "123 Main Street",
    bloodType: "O+",
    birthday: "1990-01-01",
    sex: "FEMALE" as const,
  };

  it("requires a valid email address", () => {
    const result = teacherSchema.safeParse({
      ...validTeacher,
      email: "",
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

  it("requires class and subject assignments for a new teacher", () => {
    const result = teacherSchema.safeParse(validTeacher);

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected new teacher assignments to be required");
    }
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["classIds"] }),
      ])
    );
  });

  it("accepts multiple class and subject assignments", () => {
    const result = teacherSchema.safeParse({
      ...validTeacher,
      classIds: ["1", "2"],
      subjects: ["3", "4"],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.classIds).toEqual([1, 2]);
    expect(result.data.subjects).toEqual(["3", "4"]);
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
