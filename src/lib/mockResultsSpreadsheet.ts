import type { AssessmentReportRow } from "@/lib/resultsData";

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cell(value: string | number, style?: string, attributes = "") {
  const type = typeof value === "number" ? "Number" : "String";
  const styleAttribute = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttribute}${attributes}><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`;
}

export function createMockResultsSpreadsheetXml(
  reports: AssessmentReportRow[]
) {
  const first = reports[0];
  if (!first) return null;

  const subjects = [...first.subjectLines].sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName)
  );
  const overallGradeColumn = subjects.length * 2 + 2;
  const firstHeader = [
    cell("Student", "Header", ' ss:MergeDown="1"'),
    ...subjects.map((subject) =>
      cell(subject.subjectName, "Header", ' ss:MergeAcross="1"')
    ),
    cell("Overall Grade", "Header", ' ss:MergeDown="1"'),
  ].join("");

  const secondHeader = subjects
    .flatMap((_, index) => [
      cell("Score", "Subheader", index === 0 ? ' ss:Index="2"' : ""),
      cell("Grade", "Subheader"),
    ])
    .join("");

  const sortedReports = [...reports].sort((a, b) =>
    a.studentName.localeCompare(b.studentName)
  );
  const dataRows = sortedReports
    .map((report) => {
      const linesBySubject = new Map(
        report.subjectLines.map((line) => [line.subjectId, line])
      );
      const subjectCells = subjects
        .flatMap((subject) => {
          const line = linesBySubject.get(subject.subjectId);
          return [
            cell(line?.score ?? ""),
            cell(line?.grade ?? ""),
          ];
        })
        .join("");
      return `<Row>${cell(report.studentName)}${subjectCells}${cell(report.overallGrade ?? "")}</Row>`;
    })
    .join("");

  const columns = [
    '<Column ss:Width="190"/>',
    ...subjects.flatMap(() => [
      '<Column ss:Width="65"/>',
      '<Column ss:Width="65"/>',
    ]),
    '<Column ss:Width="105"/>',
  ].join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1"/><Interior ss:Color="#DCEBFA" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Subheader"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#EEF4FA" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Mock Results">
    <Table ss:ExpandedColumnCount="${overallGradeColumn}" ss:ExpandedRowCount="${sortedReports.length + 2}" x:FullColumns="1" x:FullRows="1">
      ${columns}
      <Row>${firstHeader}</Row>
      <Row>${secondHeader}</Row>
      ${dataRows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><SplitVertical>1</SplitVertical><LeftColumnRightPane>1</LeftColumnRightPane><ActivePane>0</ActivePane></WorksheetOptions>
  </Worksheet>
</Workbook>`;
}
