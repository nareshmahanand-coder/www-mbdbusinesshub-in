import jsPDF from "jspdf";
import raktadanTemplateUrl from "@/assets/raktadan-template.jpg";
import ngoSealUrl from "@/assets/ngo-seal.png";
import ngoSignatureUrl from "@/assets/ngo-signature.png";

export interface RaktadanCertificateData {
  donorName: string;
  fatherName?: string;
  bloodGroup: string;
  donationDate: string;       // human-readable
  hospitalName?: string;
  hospitalAddress?: string;
  city?: string;
  certificateNo: string;
  /** When true, draws a big diagonal "नमूना / SAMPLE" watermark and skips seal+signature */
  sample?: boolean;
}

/**
 * Raktadan (Blood Donation) Certificate — uses raktadan-template.jpg as base.
 * Overlays donor info into the central blank area, plus seal (right) + signature (left).
 * If `sample` is true, renders a watermarked preview without seal/signature.
 */
export function generateRaktadanCertificatePDF(d: RaktadanCertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();  // 297

  // Background template
  try {
    doc.addImage(raktadanTemplateUrl, "JPEG", 0, 0, pw, ph);
  } catch {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
  }

  // ---- Overlay donor data on the printed blank lines of the template ----
  // Coordinates calibrated against raktadan-template.jpg (A4 portrait)
  doc.setFont("times", "bold");
  doc.setTextColor(20, 20, 60);

  // Donor name — sits on the blank between "गर्व के साथ ____ (Donor Name)"
  doc.setFontSize(11);
  doc.text(d.donorName || "—", 124, 150, { align: "center" });

  // Blood Group (red) — on blank after "Blood Group:"
  doc.setFontSize(11);
  doc.setTextColor(160, 20, 30);
  doc.text(d.bloodGroup || "—", 80, 190, { align: "center" });

  // Date of Donation — on blank after "Date of Donation:"
  doc.setTextColor(20, 20, 60);
  doc.text(d.donationDate || "—", 175, 190, { align: "center" });

  // Address — on blank after "पता (Address):"
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const addr = d.hospitalAddress || d.city || d.hospitalName || "—";
  const addrLines = doc.splitTextToSize(addr, 90);
  doc.text(addrLines, 105, 200, { align: "center" });

  // ---- Sample watermark OR seal+signature ----
  if (d.sample) {
    // Big diagonal watermark
    const gs: any = (doc as any).GState
      ? new (doc as any).GState({ opacity: 0.18 })
      : null;
    if (gs && (doc as any).setGState) (doc as any).setGState(gs);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(80);
    doc.setTextColor(180, 0, 0);
    // jsPDF supports angle via options
    doc.text("नमूना / SAMPLE", pw / 2, ph / 2 + 10, {
      align: "center",
      angle: 30,
    } as any);
    if (gs && (doc as any).setGState) {
      const reset: any = new (doc as any).GState({ opacity: 1 });
      (doc as any).setGState(reset);
    }
  } else {
    // Footer placeholders on template:
    //   Date line       : ~x 22-72   (label "Date" at 38)
    //   President's Sig : ~x 95-150  (label at 122)
    //   Seal of NGO     : ~x 155-195 (label at 175)
    // Footer baseline ≈ y 248 (label row). Place above the label.
    try { doc.text(d.donationDate || "—", 38, 240, { align: "center" }); } catch { /* ignore */ }
    try { doc.addImage(ngoSignatureUrl, "PNG", 98, 222, 50, 22); } catch { /* ignore */ }
    try { doc.addImage(ngoSealUrl, "PNG", 158, 215, 32, 32); } catch { /* ignore */ }
  }

  // ---- Footer: cert no + issued date ----
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Cert No: ${d.certificateNo}`, pw - 12, ph - 8, { align: "right" });
  doc.text(
    `Issued: ${new Date().toLocaleDateString("en-IN")}`,
    12,
    ph - 8
  );

  return doc;
}

export function generateRaktadanCertNo(): string {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NGO-LSESS-RD-${ts}-${rand}`;
}

export function downloadRaktadanCertificate(d: RaktadanCertificateData): Blob {
  const doc = generateRaktadanCertificatePDF(d);
  const safe = (d.donorName || "donor").replace(/\s+/g, "_");
  const suffix = d.sample ? "SAMPLE" : "Official";
  doc.save(`Raktadan-Certificate-${suffix}-${safe}.pdf`);
  return doc.output("blob");
}

/**
 * Render the certificate to a data URL image (for non-downloadable on-screen preview).
 * Returns a PNG data URL of the first page rendered via the PDF's canvas.
 */
export async function renderRaktadanPreviewDataUrl(
  d: RaktadanCertificateData
): Promise<string> {
  const doc = generateRaktadanCertificatePDF({ ...d, sample: true });
  // jsPDF can output a data URI of the PDF, but we want an image preview.
  // Easiest: return the PDF as a blob URL — but for inline non-downloadable
  // image preview we just return the template image with overlay text via canvas.
  return await renderPreviewToCanvas(d);
}

async function renderPreviewToCanvas(d: RaktadanCertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas ctx"));
      ctx.drawImage(img, 0, 0);

      // Overlay donor name centered
      ctx.fillStyle = "#a01420";
      ctx.font = `bold ${Math.round(img.width * 0.045)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(d.donorName || "—", img.width / 2, img.height * 0.45);

      ctx.fillStyle = "#1a237e";
      ctx.font = `bold ${Math.round(img.width * 0.028)}px Georgia, serif`;
      ctx.fillText(
        `Blood Group: ${d.bloodGroup}`,
        img.width / 2,
        img.height * 0.52
      );
      ctx.fillText(
        `Date: ${d.donationDate}`,
        img.width / 2,
        img.height * 0.56
      );

      // Diagonal watermark
      ctx.save();
      ctx.translate(img.width / 2, img.height / 2);
      ctx.rotate((-25 * Math.PI) / 180);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#c0212f";
      ctx.font = `bold ${Math.round(img.width * 0.13)}px Arial, sans-serif`;
      ctx.fillText("नमूना • SAMPLE", 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("template load failed"));
    img.src = raktadanTemplateUrl;
  });
}