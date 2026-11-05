import { describe, expect, it } from "vitest";
import {
  createMockResultsSpreadsheetXml,
} from "../mockResultsSpreadsheet";
import type { AssessmentReportRow } from "../resultsData";

function report(
  studentName: string,
  scores: { subjectId: number; subjectName: string; score: number; grade: string }[],
  overallGrade: string
): AssessmentReportRow {
  return {
    id: studentName.length,
    type: "MOCK",
    assessmentNumber: 2,
    studentId: studentName,
    studentName,
    classId: 1,
    className: "Class 1",
    academicYearId: 1,
    academicYearLabel: "2026/2027",
    termNumber: 1,
    totalScore: scores.reduce((total, item) => total + item.score, 0),
    overallPercentage: 80,
    overallGrade,
    overallRemark: "Very Good",
    isPublished: true,
    isWithheld: false,
    gradingLevel: "PRIMARY",
    gradingScaleEntries: [],
    subjectLines: scores.map((item) => ({
      ...item,
      remark: "Good",
      canEdit: false,
    })),
  };
}

describe("createMockResultsSpreadsheetXml", () => {
  it("creates merged subject headers with score and grade subheadings", () => {
    const xml = createMockResultsSpreadsheetXml([
      report("Zoe Student", [
        { subjectId: 2, subjectName: "English", score: 78, grade: "B" },
        { subjectId: 1, subjectName: "Math", score: 91, grade: "A" },
      ], "A"),
    ]);

    expect(xml).toContain('ss:MergeDown="1"');
    expect(xml).toContain('ss:MergeAcross="1"');
    expect(xml).toContain("<Data ss:Type=\"String\">Math</Data>");
    expect(xml).toContain("<Data ss:Type=\"String\">Score</Data>");
    expect(xml).toContain("<Data ss:Type=\"String\">Grade</Data>");
    expect(xml).toContain("<Data ss:Type=\"String\">Overall Grade</Data>");
    expect(xml?.indexOf("<Data ss:Type=\"String\">English</Data>")).toBeLessThan(
      xml?.indexOf("<Data ss:Type=\"String\">Math</Data>") ?? 0
    );
    expect(xml).toContain("<Data ss:Type=\"Number\">91</Data>");
    expect(xml).toContain("<Data ss:Type=\"String\">A</Data>");
  });

  it("sorts students by name and escapes spreadsheet XML values", () => {
    const xml = createMockResultsSpreadsheetXml([
      report("Zoe & Co", [
        { subjectId: 1, subjectName: "Math <Advanced>", score: 70, grade: "B" },
      ], "B"),
      report("Amy Student", [
        { subjectId: 1, subjectName: "Math <Advanced>", score: 90, grade: "A" },
      ], "A"),
    ]);

    expect(xml).toContain("Math &lt;Advanced&gt;");
    expect(xml).toContain("Zoe &amp; Co");
    expect(xml?.indexOf("Amy Student")).toBeLessThan(xml?.indexOf("Zoe &amp; Co") ?? 0);
  });

  it("returns null when the selected mock has no reports", () => {
    expect(createMockResultsSpreadsheetXml([])).toBeNull();
  });
});
