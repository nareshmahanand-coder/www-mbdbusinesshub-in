import jsPDF from "jspdf";

interface CertificateData {
  userName: string;
  courseName: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(255, 153, 51);
  doc.setLineWidth(3);
  doc.rect(8, 8, pw - 16, ph - 16);
  doc.setDrawColor(19, 136, 8);
  doc.setLineWidth(1.5);
  doc.rect(12, 12, pw - 24, ph - 24);

  // Top tricolor stripe
  doc.setFillColor(255, 153, 51);
  doc.rect(12, 12, pw - 24, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(12, 16, pw - 24, 4, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(12, 20, pw - 24, 4, "F");

  let y = 42;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(40, 40, 40);
  doc.text("Certificate of Completion", pw / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(14);
  doc.setTextColor(255, 153, 51);
  doc.text("Mera Bharat Dukaan - Kaushal Vikas", pw / 2, y, { align: "center" });
  y += 16;

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(60, y, pw - 60, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text("This is to certify that", pw / 2, y, { align: "center" });
  y += 14;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(19, 100, 8);
  doc.text(data.userName || "Student", pw / 2, y, { align: "center" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("has successfully completed the course", pw / 2, y, { align: "center" });
  y += 12;

  // Course
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`"${data.courseName}"`, pw / 2, y, { align: "center" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Score: ${data.score}/${data.totalQuestions} | Date: ${data.date}`, pw / 2, y, { align: "center" });
  y += 20;

  // Signature line
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(pw / 2 - 40, y, pw / 2 + 40, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Authorized by Mera Bharat Dukaan", pw / 2, y, { align: "center" });

  // Bottom stripe
  doc.setFillColor(255, 153, 51);
  doc.rect(12, ph - 24, pw - 24, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(12, ph - 20, pw - 24, 4, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(12, ph - 16, pw - 24, 4, "F");

  return doc;
}

export function downloadCertificate(data: CertificateData) {
  const doc = generateCertificatePDF(data);
  doc.save(`MBD-Certificate-${data.courseName.replace(/\s+/g, "_")}.pdf`);
}
