import { describe, expect, it } from "vitest";
import { buildSuggestionGroups, getSimilarityScore } from "../searchSuggestions";

describe("searchSuggestions", () => {
  it("scores similar letters highly for partial names", () => {
    expect(getSimilarityScore("jhn", "john")).toBeGreaterThan(0.6);
  });

  it("returns matching student suggestions for admin search", () => {
    const groups = buildSuggestionGroups(
      {
        students: [{ id: "1", name: "John", surname: "Doe" }],
        teachers: [],
        parents: [],
      },
      "jhn",
      "admin",
    );

    expect(groups.students).toHaveLength(1);
    expect(groups.students[0].name).toBe("John");
  });
});
