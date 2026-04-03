import jsPDF from "jspdf";

interface ReceiptData {
  userName: string;
  userEmail: string;
  plan: "monthly" | "yearly";
  amount: number;
  transactionId: string;
  startsAt: string;
  endsAt: string;
  receiptNumber: string;
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // ── Top tricolor stripe ──
  doc.setFillColor(255, 153, 51); // Saffron
  doc.rect(0, 0, pageWidth, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 3, pageWidth, 3, "F");
  doc.setFillColor(19, 136, 8); // Green
  doc.rect(0, 6, pageWidth, 3, "F");

  y = 18;

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Mera Bharat Dukaan", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text("Bharat Gaurav Membership - Payment Receipt", pageWidth / 2, y, { align: "center" });
  y += 10;

  // ── Divider ──
  doc.setDrawColor(255, 153, 51);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── Receipt Info Box ──
  doc.setFillColor(249, 249, 249);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Receipt No:", margin + 6, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(data.receiptNumber, margin + 36, y + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", margin + 6, y + 16);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), margin + 22, y + 16);

  doc.setFont("helvetica", "bold");
  doc.text("Status:", pageWidth / 2 + 6, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(19, 136, 8);
  doc.text("Payment Received (Pending Admin Approval)", pageWidth / 2 + 24, y + 8);

  y += 34;

  // ── Customer Details ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text("Customer Details", margin, y);
  y += 8;

  const drawRow = (label: string, value: string, rowY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin + 4, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(value, margin + 55, rowY);
  };

  drawRow("Name:", data.userName || "N/A", y);
  y += 7;
  drawRow("Email:", data.userEmail || "N/A", y);
  y += 14;

  // ── Payment Details ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text("Payment Details", margin, y);
  y += 8;

  drawRow("Plan:", data.plan === "monthly" ? "Monthly (1 Month)" : "Yearly (12 Months)", y);
  y += 7;
  drawRow("Amount Paid:", `Rs. ${data.amount}`, y);
  y += 7;
  drawRow("Transaction ID:", data.transactionId, y);
  y += 7;
  drawRow("Payment Method:", "UPI", y);
  y += 7;
  drawRow("Validity:", `${data.startsAt} to ${data.endsAt}`, y);
  y += 14;

  // ── Important Note ──
  doc.setFillColor(255, 248, 235);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 3, 3, "F");
  doc.setDrawColor(255, 153, 51);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(180, 100, 0);
  doc.text("Important:", margin + 6, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 80, 20);
  doc.text("This receipt confirms your payment has been received. Your premium membership", margin + 6, y + 14);
  doc.text("will be fully activated once verified by the Admin team.", margin + 6, y + 19);

  y += 32;

  // ── Footer divider ──
  doc.setDrawColor(19, 136, 8);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("Mera Bharat Dukaan | merabharatdukaan.lovable.app", pageWidth / 2, y, { align: "center" });

  // ── Bottom tricolor stripe ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(255, 153, 51);
  doc.rect(0, pageH - 9, pageWidth, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, pageH - 6, pageWidth, 3, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(0, pageH - 3, pageWidth, 3, "F");

  return doc;
}

export function downloadReceipt(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  doc.save(`MBD-Receipt-${data.receiptNumber}.pdf`);
}
