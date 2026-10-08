import type { TermlyReportRow } from "@/lib/resultsData";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadSignatureImage(signature: string | null) {
  if (!signature?.startsWith("https://")) return null;

  const image = new Image();
  image.crossOrigin = "anonymous";
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load a report signature image."));
  });
  image.src = signature;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare a report signature image.");
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function exportTermlyReportPdf(report: TermlyReportRow) {
  const { jsPDF } = await import("jspdf");
  const autoTable = ((await import("jspdf-autotable")).default as any) as (
    doc: any,
    options: any
  ) => void;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  // Header: show school details if available
  if (report.schoolSettings?.name) {
    doc.setFontSize(14);
    doc.text(report.schoolSettings.name, margin, y);
    y += 6;
    doc.setFontSize(9);
    if (report.schoolSettings.address) {
      doc.text(report.schoolSettings.address, margin, y);
      y += 5;
    }
    const locTel = [report.schoolSettings.location, report.schoolSettings.telephone]
      .filter(Boolean)
      .join(" ");
    if (locTel) {
      doc.text(locTel, margin, y);
      y += 6;
    }
    doc.setFontSize(12);
    doc.text("LEARNER'S TERMINAL REPORT", margin, y);
    y += 8;
  } else {
    doc.setFontSize(16);
    doc.text("Termly Report Card", margin, y);
    y += 8;
  }

  doc.setFontSize(10);
  const meta = [
    `Student's Name: ${report.studentName}`,
    `Academic Year: ${report.academicYearLabel}`,
    `Class: ${report.className}`,
    `Term: ${report.termNumber}`,
    `No. On Roll: ${report.totalOnRoll}`,
    `Total Attendance: ${report.totalAttendance}`,
    `Vacation Date: ${formatDate(report.vacationDate)}`,
    `Reopening Date: ${formatDate(report.reopeningDate)}`,
  ];
  for (const line of meta) {
    doc.text(line, margin, y);
    y += 5;
  }
  y += 3;

  const totals = report.subjectLines.reduce(
    (acc, line) => ({
      classScore: acc.classScore + (line.classScore ?? 0),
      examScore: acc.examScore + (line.examScore ?? 0),
      totalMarks: acc.totalMarks + (line.totalMarks ?? 0),
    }),
    { classScore: 0, examScore: 0, totalMarks: 0 }
  );

  autoTable(doc, {
    startY: y,
    head: [["Subjects", "Class Score", "Exams Score", "Total Marks", "Grade", "Proficiency Level (Grade)"]],
    body: [
      ...report.subjectLines.map((l) => [
        l.subjectName,
        String(l.classScore),
        String(l.examScore),
        String(l.totalMarks),
        l.grade ?? "—",
        l.remark ?? "—",
      ]),
      [
        "Total",
        String(totals.classScore),
        String(totals.examScore),
        String(totals.totalMarks),
        "",
        "",
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [2, 60, 99], textColor: [255, 255, 255] },
    bodyStyles: { minCellHeight: 6 },
    footStyles: { fillColor: [247, 218, 176], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 46 },
      5: { cellWidth: 46 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  const summary = [
    `Overall percentage: ${report.overallPercentage ?? "—"}`,
    `Overall grade: ${report.overallGrade ?? "—"}`,
    `Interest: ${report.interest ?? "—"}`,
    `Conduct: ${report.conduct ?? "—"}`,
    `Result: ${report.resultStatus ?? "—"}`,
  ];

  doc.setFontSize(10);
  const leftX = margin;
  const rightX = 110;

  doc.setFont("helvetica", "bold");
  doc.text("Overall summary", leftX, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  summary.forEach((line, index) => {
    doc.text(line, leftX, y + index * 5);
  });

  const remarksStartY = y;
  doc.setFont("helvetica", "bold");
  doc.text("Facilitator's Remarks", rightX, remarksStartY);
  doc.text("Headteacher's Remarks", rightX + 70, remarksStartY);
  doc.setFont("helvetica", "normal");
  const facRemarks = doc.splitTextToSize(report.supervisorRemarks ?? "—", 60);
  const headRemarks = doc.splitTextToSize(report.headteacherRemarks ?? "—", 60);
  const remarkLines = Math.max(facRemarks.length, headRemarks.length);

  for (let i = 0; i < remarkLines; i += 1) {
    const yLine = remarksStartY + 5 + i * 5;
    if (facRemarks[i]) doc.text(facRemarks[i], rightX, yLine);
    if (headRemarks[i]) doc.text(headRemarks[i], rightX + 70, yLine);
  }

  y = remarksStartY + 5 + remarkLines * 5 + 12;
  const sigY = y;
  const facilitatorSignature = report.supervisorSignature;
  const [facilitatorSignatureImage, headteacherSignatureImage] = await Promise.all([
    loadSignatureImage(facilitatorSignature),
    loadSignatureImage(report.headteacherSignature),
  ]);
  const facilitatorSignatureX = leftX;
  const headteacherSignatureX = rightX;
  if (facilitatorSignatureImage) {
    doc.addImage(facilitatorSignatureImage, "PNG", facilitatorSignatureX + 6, sigY - 14, 48, 12);
  } else if (facilitatorSignature) {
    doc.setFontSize(9);
    doc.text(facilitatorSignature, facilitatorSignatureX, sigY - 3);
  }
  if (headteacherSignatureImage) {
    doc.addImage(headteacherSignatureImage, "PNG", headteacherSignatureX + 6, sigY - 14, 48, 12);
  } else if (report.headteacherSignature) {
    doc.setFontSize(9);
    doc.text(report.headteacherSignature, headteacherSignatureX, sigY - 3);
  }
  doc.setFontSize(10);
  doc.setLineWidth(0.3);
  doc.line(facilitatorSignatureX, sigY, facilitatorSignatureX + 60, sigY);
  doc.text("Class Facilitator's Signature", facilitatorSignatureX, sigY + 5);
  doc.line(headteacherSignatureX, sigY, headteacherSignatureX + 60, sigY);
  doc.text("Headteacher's Signature", headteacherSignatureX, sigY + 5);

  y = sigY + 18;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Grading System Details", leftX, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    head: [["% Range", "Grade", "Remarks"]],
    body: [
      ["80 - 100", "A", "Advance"],
      ["75 - 79", "P", "Proficient"],
      ["70 - 74", "AP", "Approaching Proficiency"],
      ["65 - 69", "D", "Developing"],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 60, 99], textColor: [255, 255, 255] },
    margin: { left: leftX, right: margin },
  });

  const safeName = report.studentName.replace(/[^\w\s-]/g, "").trim();
  doc.save(
    `report-${safeName}-term${report.termNumber}-${report.academicYearLabel}.pdf`
  );
}
