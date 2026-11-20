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
  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = margin + 2;

  if (report.schoolSettings?.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const schoolName = doc.splitTextToSize(report.schoolSettings.name, contentWidth);
    doc.text(schoolName, pageWidth / 2, y, { align: "center" });
    y += schoolName.length * 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const schoolAddress = report.schoolSettings.address
      ? doc.splitTextToSize(report.schoolSettings.address, contentWidth)
      : [];
    if (schoolAddress.length) {
      doc.text(schoolAddress, pageWidth / 2, y, { align: "center" });
      y += schoolAddress.length * 3;
    }

    const contactLine = [
      report.schoolSettings.location,
      report.schoolSettings.telephone ? `Tel: ${report.schoolSettings.telephone}` : null,
      report.schoolSettings.email,
    ].filter(Boolean).join(" · ");
    const contactLines = contactLine
      ? doc.splitTextToSize(contactLine, contentWidth)
      : [];
    if (contactLines.length) {
      doc.text(contactLines, pageWidth / 2, y, { align: "center" });
      y += contactLines.length * 3;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Termly Report Card", pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  y += 1;
  doc.setFillColor(6, 46, 97);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("LEARNER'S TERMINAL REPORT", pageWidth / 2, y + 4, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    theme: "grid",
    body: [
      [
        `Student's Name: ${report.studentName}`,
        `Academic Year: ${report.academicYearLabel}`,
        `Class: ${report.className}`,
        `Term: ${report.termNumber}`,
      ],
      [
        `No. On Roll: ${report.totalOnRoll}`,
        `Total Attendance: ${report.totalAttendance}`,
        `Vacation Date: ${formatDate(report.vacationDate)}`,
        `Reopening Date: ${formatDate(report.reopeningDate)}`,
      ],
    ],
    styles: {
      fontSize: 7,
      cellPadding: 1.1,
      minCellHeight: 7,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 4 },
      1: { cellWidth: contentWidth / 4 },
      2: { cellWidth: contentWidth / 4 },
      3: { cellWidth: contentWidth / 4 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

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
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    theme: "grid",
    head: [["OVERALL %", "OVERALL GRADE", "RESULT", "INTEREST", "CONDUCT"]],
    body: [[
      report.overallPercentage != null
        ? `${report.overallPercentage.toFixed(1)}%`
        : "—",
      report.overallGrade ?? "—",
      report.resultStatus ?? "—",
      report.interest ?? "—",
      report.conduct ?? "—",
    ]],
    styles: {
      fontSize: 6.5,
      cellPadding: 1,
      minCellHeight: 7,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.16 },
      1: { cellWidth: contentWidth * 0.2 },
      2: { cellWidth: contentWidth * 0.18 },
      3: { cellWidth: contentWidth * 0.23 },
      4: { cellWidth: contentWidth * 0.23 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SUBJECT PERFORMANCE", margin, y + 2.5);
  y += 3.5;

  const subjectBody = [
    ...report.subjectLines.map((line) => [
      line.subjectName,
      String(line.classScore),
      String(line.examScore),
      String(line.totalMarks),
      line.grade ?? "—",
      line.remark ?? "—",
    ]),
    [
      "Total",
      String(totals.classScore),
      String(totals.examScore),
      String(totals.totalMarks),
      "",
      "",
    ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    theme: "grid",
    head: [[
      "SUBJECT",
      "CLASS",
      "EXAM",
      "TOTAL",
      "GRADE",
      report.gradingLevel === "JHS" ? "REMARKS" : "PROFICIENCY LEVEL",
    ]],
    body: subjectBody,
    styles: {
      fontSize: report.subjectLines.length > 18 ? 5.5 : 6.5,
      cellPadding: 0.7,
      minCellHeight: 3.8,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [2, 46, 97], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 15 },
      5: { cellWidth: contentWidth - 107 },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === subjectBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [254, 243, 199];
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("REPORT REMARKS", margin, y + 2.5);
  y += 3.5;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    theme: "grid",
    head: [["OVERALL REMARK", "CLASS FACILITATOR", "HEADTEACHER"]],
    body: [[
      report.overallRemark ?? "—",
      report.supervisorRemarks ?? "—",
      report.headteacherRemarks ?? "—",
    ]],
    styles: {
      fontSize: 6.5,
      cellPadding: 1.2,
      minCellHeight: 9,
      overflow: "linebreak",
      valign: "top",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] },
    columnStyles: {
      0: { cellWidth: contentWidth / 3 },
      1: { cellWidth: contentWidth / 3 },
      2: { cellWidth: contentWidth / 3 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  const signatureLineY = y;
  const signatureLineWidth = 88;
  const facilitatorSignatureX = margin;
  const headteacherSignatureX = pageWidth - margin - signatureLineWidth;
  const [facilitatorSignatureImage, headteacherSignatureImage] = await Promise.all([
    loadSignatureImage(report.supervisorSignature),
    loadSignatureImage(report.headteacherSignature),
  ]);

  if (facilitatorSignatureImage) {
    doc.addImage(
      facilitatorSignatureImage,
      "PNG",
      facilitatorSignatureX + (signatureLineWidth - 42) / 2,
      signatureLineY - 8,
      42,
      8
    );
  } else if (report.supervisorSignature) {
    doc.setFontSize(7);
    doc.text(report.supervisorSignature, facilitatorSignatureX + signatureLineWidth / 2, signatureLineY - 1, {
      align: "center",
      maxWidth: signatureLineWidth - 4,
    });
  }

  if (headteacherSignatureImage) {
    doc.addImage(
      headteacherSignatureImage,
      "PNG",
      headteacherSignatureX + (signatureLineWidth - 42) / 2,
      signatureLineY - 8,
      42,
      8
    );
  } else if (report.headteacherSignature) {
    doc.setFontSize(7);
    doc.text(report.headteacherSignature, headteacherSignatureX + signatureLineWidth / 2, signatureLineY - 1, {
      align: "center",
      maxWidth: signatureLineWidth - 4,
    });
  }

  doc.setFontSize(6.5);
  doc.setLineWidth(0.3);
  doc.line(facilitatorSignatureX, signatureLineY, facilitatorSignatureX + signatureLineWidth, signatureLineY);
  doc.line(headteacherSignatureX, signatureLineY, headteacherSignatureX + signatureLineWidth, signatureLineY);
  doc.text("CLASS FACILITATOR'S SIGNATURE", facilitatorSignatureX + signatureLineWidth / 2, signatureLineY + 3.5, {
    align: "center",
  });
  doc.text("HEADTEACHER'S SIGNATURE", headteacherSignatureX + signatureLineWidth / 2, signatureLineY + 3.5, {
    align: "center",
  });
  y = signatureLineY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("GRADING SYSTEM REFERENCE", margin, y + 2.5);
  y += 3.5;
  doc.setFont("helvetica", "normal");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    theme: "grid",
    head: [["% RANGE", "GRADE", "REMARKS"]],
    body: report.gradingScaleEntries.length
      ? report.gradingScaleEntries.map((entry) => [
          `${entry.minScore}–${entry.maxScore}`,
          entry.grade,
          entry.remark,
        ])
      : [["—", "—", `No grading scale configured for ${report.gradingLevel}.`]],
    styles: {
      fontSize: 6.5,
      cellPadding: 0.8,
      minCellHeight: 3.5,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [226, 232, 240], textColor: [71, 85, 105] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: contentWidth - 70 },
    },
  });

  const safeName = report.studentName.replace(/[^\w\s-]/g, "").trim();
  const safeAcademicYear = report.academicYearLabel.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
  doc.save(
    `report-${safeName}-term${report.termNumber}-${safeAcademicYear}.pdf`
  );
}
