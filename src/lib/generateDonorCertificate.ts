import jsPDF from "jspdf";

export interface DonorCertificateData {
  donorName: string;
  bloodGroup: string;
  city: string;
  date: string;
  certificateNo: string;
  recipientName?: string;
}

/**
 * NGO Blood-Donation Certificate (A4 landscape, Tiranga theme)
 * Issued by: लाइव शो शिक्षा एवं सामाजिक कल्याण समिति
 * Hosted on: Mera Bharat Dukaan — भारत मित्र AI
 */
export function generateDonorCertificatePDF(d: DonorCertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Background cream
  doc.setFillColor(255, 251, 240);
  doc.rect(0, 0, pw, ph, "F");

  // Outer borders
  doc.setDrawColor(220, 38, 38); // blood red
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

  let y = 38;

  // NGO Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(26, 35, 126);
  doc.text("लाइव शो शिक्षा एवं सामाजिक कल्याण समिति", pw / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text("Live Show Shiksha Evam Samajik Kalyan Samiti (Regd. NGO)", pw / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(255, 140, 0);
  doc.text("In collaboration with मेरा भारत दुकान — भारत मित्र AI", pw / 2, y, { align: "center" });
  y += 9;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(220, 38, 38);
  doc.text("Blood Donation Certificate", pw / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text("रक्तदान प्रशंसा प्रमाण-पत्र", pw / 2, y, { align: "center" });
  y += 10;

  // Divider
  doc.setDrawColor(200, 170, 100);
  doc.setLineWidth(0.5);
  doc.line(50, y, pw - 50, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("This is to honour and certify that / सम्मानपूर्वक प्रमाणित किया जाता है कि", pw / 2, y, { align: "center" });
  y += 13;

  // Donor name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(19, 100, 8);
  doc.text(d.donorName || "Donor", pw / 2, y, { align: "center" });
  y += 11;

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("ने स्वेच्छा से रक्तदान कर एक बहुमूल्य जीवन बचाने में योगदान दिया है।", pw / 2, y, { align: "center" });
  y += 6;
  doc.text("Has voluntarily donated blood and contributed to saving a precious life.", pw / 2, y, { align: "center" });
  y += 12;

  // Blood group + city chip
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text(`Blood Group / रक्त समूह: ${d.bloodGroup}`, pw / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`City / शहर: ${d.city || "—"}`, pw / 2, y, { align: "center" });

  // Footer
  const footerY = ph - 38;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(25, footerY, 85, footerY);
  doc.text(`Date: ${d.date}`, 55, footerY + 5, { align: "center" });

  doc.line(pw - 85, footerY, pw - 25, footerY);
  doc.text(`Cert No: ${d.certificateNo}`, pw - 55, footerY + 5, { align: "center" });

  // Center red stamp
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1.2);
  doc.circle(pw / 2, footerY - 2, 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text("LIVE SHOW NGO", pw / 2, footerY - 5, { align: "center" });
  doc.text("BLOOD DONOR", pw / 2, footerY - 1, { align: "center" });
  doc.setFontSize(6);
  doc.setTextColor(26, 35, 126);
  doc.text("✓ HONOURED", pw / 2, footerY + 3, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Authorised Signatory — लाइव शो शिक्षा एवं सामाजिक कल्याण समिति", pw / 2, footerY + 12, { align: "center" });

  // Bottom tricolor
  doc.setFillColor(255, 153, 51);
  doc.rect(13, ph - 25, pw - 26, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(13, ph - 21, pw - 26, 4, "F");
  doc.setFillColor(19, 136, 8);
  doc.rect(13, ph - 17, pw - 26, 4, "F");

  return doc;
}

export function generateDonorCertNo(): string {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NGO-LSESS-${ts}-${rand}`;
}

export function downloadDonorCertificate(d: DonorCertificateData): Blob {
  const doc = generateDonorCertificatePDF(d);
  doc.save(`Blood-Donor-Certificate-${d.donorName.replace(/\s+/g, "_")}.pdf`);
  return doc.output("blob");
}