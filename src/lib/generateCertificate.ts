import jsPDF from "jspdf";

export interface CertificateData {
  userName: string;
  courseName: string;
  scorePercent: number;
  date: string;
  certificateId: string;
}

export function generateCertificateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBD-${ts}-${rand}`;
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 251, 240);
  doc.rect(0, 0, pw, ph, "F");

  // Outer borders
  doc.setDrawColor(255, 140, 0);
  doc.setLineWidth(3);
  doc.rect(8, 8, pw - 16, ph - 16);
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(1.2);
  doc.rect(13, 13, pw - 26, ph - 26);

  // Top tricolor band
  doc.setFillColor(255, 153, 51);
  doc.rect(13, 13, pw - 26, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(13, 17, pw - 26, 4, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(13, 21, pw - 26, 4, "F");

  let y = 42;

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 140, 0);
  doc.text("मेरा भारत दुकान | MERA BHARAT DUKAAN", pw / 2, y, { align: "center" });
  y += 10;

  // Title
  doc.setFontSize(30);
  doc.setTextColor(26, 35, 126);
  doc.text("Skill Development Certificate", pw / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text("कौशल विकास प्रमाणपत्र", pw / 2, y, { align: "center" });
  y += 12;

  // Divider
  doc.setDrawColor(200, 170, 100);
  doc.setLineWidth(0.5);
  doc.line(50, y, pw - 50, y);
  y += 10;

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("This is to certify that / प्रमाणित किया जाता है कि", pw / 2, y, { align: "center" });
  y += 14;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(19, 100, 8);
  doc.text(data.userName || "Student", pw / 2, y, { align: "center" });
  y += 12;

  // Course line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("ने मेरा भारत दुकान के माध्यम से निम्नलिखित पाठ्यक्रम की परीक्षा सफलतापूर्वक उत्तीर्ण की है:", pw / 2, y, { align: "center" });
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(26, 35, 126);
  doc.text(`"${data.courseName}"`, pw / 2, y, { align: "center" });
  y += 10;

  // Score
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text(`Score / अंक: ${data.scorePercent}%`, pw / 2, y, { align: "center" });
  y += 14;

  // Footer row — Date | Stamp | Cert ID
  const footerY = ph - 38;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  // Date (left)
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(25, footerY, 85, footerY);
  doc.text(`Date: ${data.date}`, 55, footerY + 5, { align: "center" });

  // Cert ID (right)
  doc.line(pw - 85, footerY, pw - 25, footerY);
  doc.text(`Cert ID: ${data.certificateId}`, pw - 55, footerY + 5, { align: "center" });

  // Center stamp
  doc.setDrawColor(255, 140, 0);
  doc.setLineWidth(1);
  doc.circle(pw / 2, footerY - 2, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 140, 0);
  doc.text("MERA BHARAT", pw / 2, footerY - 4, { align: "center" });
  doc.text("DUKAAN", pw / 2, footerY, { align: "center" });
  doc.setFontSize(6);
  doc.setTextColor(26, 35, 126);
  doc.text("✓ VERIFIED", pw / 2, footerY + 3, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Authorized Digital Signature & Stamp", pw / 2, footerY + 12, { align: "center" });

  // Bottom tricolor band
  doc.setFillColor(255, 153, 51);
  doc.rect(13, ph - 25, pw - 26, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(13, ph - 21, pw - 26, 4, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(13, ph - 17, pw - 26, 4, "F");

  return doc;
}

export function downloadCertificate(data: CertificateData) {
  const doc = generateCertificatePDF(data);
  doc.save(`MBD-Certificate-${data.courseName.replace(/\s+/g, "_")}.pdf`);
}

/* Export as PNG image (uses jsPDF internal canvas) */
export async function downloadCertificateImage(data: CertificateData) {
  const doc = generateCertificatePDF(data);
  // jsPDF v2: convert to data URL via output('datauristring') of an embedded canvas isn't direct.
  // Simplest: use html2canvas-free approach by rendering to PDF then converting first page to image via PDF.js is heavy.
  // Pragmatic: open the PDF in new tab AND also offer PDF download.
  // For "image" we render via an offscreen canvas using jsPDF's getImageData isn't available.
  // Workaround: produce a PNG via the same draw routine on a real canvas.
  drawCertificateOnCanvas(data).then((dataUrl) => {
    const link = document.createElement("a");
    link.download = `MBD-Certificate-${data.courseName.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
  });
}

/* Mirror the PDF design on a HTML canvas for PNG export */
async function drawCertificateOnCanvas(data: CertificateData): Promise<string> {
  const W = 1600;
  const H = 1131; // A4 landscape ratio
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // BG
  ctx.fillStyle = "#FFFBF0";
  ctx.fillRect(0, 0, W, H);

  // Borders
  ctx.strokeStyle = "#FF8C00";
  ctx.lineWidth = 12;
  ctx.strokeRect(32, 32, W - 64, H - 64);
  ctx.strokeStyle = "#1a237e";
  ctx.lineWidth = 5;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  // Top tricolor
  ctx.fillStyle = "#FF9933"; ctx.fillRect(52, 52, W - 104, 16);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(52, 68, W - 104, 16);
  ctx.fillStyle = "#138808"; ctx.fillRect(52, 84, W - 104, 16);

  // Brand
  ctx.textAlign = "center";
  ctx.fillStyle = "#FF8C00";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("मेरा भारत दुकान | MERA BHARAT DUKAAN", W / 2, 170);

  // Title
  ctx.fillStyle = "#1a237e";
  ctx.font = "bold 64px serif";
  ctx.fillText("Skill Development Certificate", W / 2, 250);
  ctx.fillStyle = "#555";
  ctx.font = "30px sans-serif";
  ctx.fillText("कौशल विकास प्रमाणपत्र", W / 2, 295);

  // Divider
  ctx.strokeStyle = "#C8AA64";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(300, 330); ctx.lineTo(W - 300, 330); ctx.stroke();

  ctx.fillStyle = "#444";
  ctx.font = "26px sans-serif";
  ctx.fillText("This is to certify that / प्रमाणित किया जाता है कि", W / 2, 390);

  // Name
  ctx.fillStyle = "#136408";
  ctx.font = "bold 60px serif";
  ctx.fillText(data.userName || "Student", W / 2, 480);

  // Course intro
  ctx.fillStyle = "#444";
  ctx.font = "26px sans-serif";
  ctx.fillText("ने मेरा भारत दुकान के माध्यम से निम्नलिखित पाठ्यक्रम की परीक्षा सफलतापूर्वक उत्तीर्ण की है:", W / 2, 540);

  ctx.fillStyle = "#1a237e";
  ctx.font = "bold 40px serif";
  ctx.fillText(`"${data.courseName}"`, W / 2, 605);

  ctx.fillStyle = "#222";
  ctx.font = "30px sans-serif";
  ctx.fillText(`Score / अंक: ${data.scorePercent}%`, W / 2, 670);

  // Stamp circle
  ctx.strokeStyle = "#FF8C00";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(W / 2, 850, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#FF8C00";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("MERA BHARAT", W / 2, 840);
  ctx.fillText("DUKAAN", W / 2, 862);
  ctx.fillStyle = "#1a237e";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("✓ VERIFIED", W / 2, 882);

  ctx.fillStyle = "#666";
  ctx.font = "20px sans-serif";
  ctx.fillText("Authorized Digital Signature & Stamp", W / 2, 950);

  // Date & ID
  ctx.textAlign = "left";
  ctx.fillStyle = "#222";
  ctx.font = "22px sans-serif";
  ctx.fillText(`Date: ${data.date}`, 120, 980);
  ctx.textAlign = "right";
  ctx.fillText(`Cert ID: ${data.certificateId}`, W - 120, 980);

  // Bottom tricolor
  ctx.fillStyle = "#FF9933"; ctx.fillRect(52, H - 100, W - 104, 16);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(52, H - 84, W - 104, 16);
  ctx.fillStyle = "#138808"; ctx.fillRect(52, H - 68, W - 104, 16);

  return canvas.toDataURL("image/png");
}
