import jsPDF from "jspdf";
import ngoSealUrl from "@/assets/ngo-seal.png";
import ngoSignatureUrl from "@/assets/ngo-signature.png";
import certTemplateUrl from "@/assets/certificate-template.jpg";

export interface DonorCertificateData {
  donorName: string;
  /** Father / Husband name */
  fatherName?: string;
  bloodGroup: string;
  city: string;
  date: string;
  certificateNo: string;
  recipientName?: string;
}

/**
 * Blood Donation Certificate — uses the master NGO template (image_14)
 * with dynamic text + president's signature (left) + round NGO seal (right)
 * overlaid exactly on the printed placeholders.
 */
export function generateDonorCertificatePDF(d: DonorCertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();  // 297

  // Master template background
  try {
    doc.addImage(certTemplateUrl, "JPEG", 0, 0, pw, ph);
  } catch {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
  }

  // Donor name
  doc.setFont("times", "bold");
  doc.setTextColor(20, 20, 60);
  doc.setFontSize(13);
  doc.text(d.donorName || "—", 92, 144);

  // Father / Husband
  doc.setFontSize(12);
  doc.text(d.fatherName || "—", 75, 156);

  // Course slot → "Blood Donation"
  doc.setFontSize(12);
  doc.setTextColor(180, 30, 30);
  doc.text(`Blood Donation (${d.bloodGroup})`, 145, 178);

  // Duration / Grade slots → city + "Honoured"
  doc.setTextColor(20, 20, 60);
  doc.setFontSize(11);
  doc.text(d.city || "—", 65, 200);
  doc.text("Honoured", 138, 200);

  // Signature (LEFT) + Seal (RIGHT)
  try { doc.addImage(ngoSignatureUrl, "PNG", 58, 218, 45, 16); } catch { /* ignore */ }
  try { doc.addImage(ngoSealUrl, "PNG", 130, 213, 32, 32); } catch { /* ignore */ }

  // Date
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 60);
  doc.text(d.date, 38, 268);

  // Cert No bottom-right
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Cert No: ${d.certificateNo}`, pw - 15, ph - 8, { align: "right" });

  return doc;
}

export function generateDonorCertNo(): string {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NGO-LSESS-${ts}-${rand}`;
}

export function downloadDonorCertificate(d: DonorCertificateData): Blob {
  const doc = generateDonorCertificatePDF(d);
  const safe = (d.donorName || "donor").replace(/\s+/g, "_");
  doc.save(`Blood-Donor-Certificate-${safe}.pdf`);
  return doc.output("blob");
}
