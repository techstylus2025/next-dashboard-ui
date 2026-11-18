import { describe, expect, it } from "vitest";
import { isCloudinaryAssignmentImage } from "../assignmentImages";

describe("isCloudinaryAssignmentImage", () => {
  it("accepts HTTPS Cloudinary image uploads", () => {
    expect(
      isCloudinaryAssignmentImage(
        "https://res.cloudinary.com/demo/image/upload/v123/assignment.png"
      )
    ).toBe(true);
  });

  it.each([
    "http://res.cloudinary.com/demo/image/upload/assignment.png",
    "https://example.com/image/upload/assignment.png",
    "https://res.cloudinary.com/demo/raw/upload/assignment.png",
    "",
    null,
  ])("rejects unapproved image URLs: %s", (value) => {
    expect(isCloudinaryAssignmentImage(value)).toBe(false);
  });
});
