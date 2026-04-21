import jsPDF from "jspdf";
import ngoSealUrl from "@/assets/ngo-seal.png";
import ngoSignatureUrl from "@/assets/ngo-signature.png";
import certTemplateUrl from "@/assets/certificate-template.jpg";

export interface CertificateData {
  userName: string;
  fatherName?: string;
  courseName: string;
  scorePercent?: number;
  date: string;
  certificateId: string;
  courseDuration?: string;
  userPhotoUrl?: string;
  /** "skill" (default) or "blood" — controls which placeholder gets filled */
  type?: "skill" | "blood";
  /** Optional grade text e.g. "A+", "Excellent" */
  grade?: string;
}

export function generateCertificateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LSF-${ts}-${rand}`;
}

/**
 * Master template-based certificate.
 * Uses certificate-template.jpg as the background and overlays dynamic
 * text + NGO seal + president's signature precisely on the printed placeholders.
 */
export function generateCertificatePDF(data: CertificateData): jsPDF {
  // Template image is portrait — use A4 portrait to match.
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();  // 297

  // 1) Draw template as full-page background
  try {
    doc.addImage(certTemplateUrl, "JPEG", 0, 0, pw, ph);
  } catch {
    // fallback white bg
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
  }

  // ─── Dynamic text overlays ──────────────────────────────────────────
  // Coordinates calibrated against template placeholders (image is ~1000x1378).
  // pw=210mm, ph=297mm. Placeholder lines roughly at:
  //   • Name line:      y ≈ 145mm, name x ≈ 90→200mm
  //   • Father line:    y ≈ 156mm, x ≈ 65→170mm
  //   • Course slot:    y ≈ 178mm, x ≈ 115→200mm  (skill)
  //   • Duration slot:  y ≈ 200mm, x ≈ 60→100mm
  //   • Grade slot:     y ≈ 200mm, x ≈ 130→180mm
  //   • Seal (right):   x ≈ 130, y ≈ 235  (centered on seal line)
  //   • Signature(L):   x ≈ 65,  y ≈ 230
  //   • Date line:      x ≈ 35,  y ≈ 268

  doc.setTextColor(20, 20, 60);
  doc.setFont("times", "bold");

  // Name (handwritten on first blank)
  doc.setFontSize(13);
  doc.text(data.userName || "—", 96, 162);

  // Father / Husband name
  doc.setFontSize(12);
  doc.text(data.fatherName || "—", 80, 174);

  // Course name OR "Blood Donation"
  doc.setFontSize(12);
  doc.setTextColor(180, 30, 30);
  if (data.type === "blood") {
    doc.text("Blood Donation", 120, 195);
  } else {
    doc.text(data.courseName || "—", 120, 195);
  }

  // Duration
  doc.setTextColor(20, 20, 60);
  doc.setFontSize(11);
  doc.text(data.courseDuration || "—", 68, 213);

  // Grade
  doc.text(data.grade || (data.scorePercent != null ? `${data.scorePercent}%` : "A"), 138, 213);

  // ─── Authentication overlays: Signature (LEFT) + Seal (RIGHT) ──────
  // Signature on the left, above "President's Signature" line
  try {
    doc.addImage(ngoSignatureUrl, "PNG", 58, 240, 42, 14);
  } catch { /* ignore */ }

  // Round NGO Seal on the right, above "Seal of NGO" line
  try {
    doc.addImage(ngoSealUrl, "PNG", 142, 232, 26, 26);
  } catch { /* ignore */ }

  // ─── Date + Cert ID ────────────────────────────────────────────────
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 60);
  doc.text(data.date, 36, 263);

  // Unique Certificate ID — bottom right (small, doesn't break design)
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Cert ID: ${data.certificateId}`, pw - 15, ph - 8, { align: "right" });

  return doc;
}

export function downloadCertificate(data: CertificateData) {
  const doc = generateCertificatePDF(data);
  const safeName = (data.userName || "certificate").replace(/\s+/g, "_");
  doc.save(`MBD-Certificate-${safeName}.pdf`);
}

/* PNG export — render the same template + overlays on a high-res canvas */
export async function downloadCertificateImage(data: CertificateData) {
  const dataUrl = await drawCertificateOnCanvas(data);
  const link = document.createElement("a");
  const safeName = (data.userName || "certificate").replace(/\s+/g, "_");
  link.download = `MBD-Certificate-${safeName}.png`;
  link.href = dataUrl;
  link.click();
}

async function drawCertificateOnCanvas(data: CertificateData): Promise<string> {
  // Load template first to get true aspect ratio
  const tmpl = await loadImage(certTemplateUrl);
  const W = 1000;
  const H = Math.round((tmpl.height / tmpl.width) * W);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(tmpl, 0, 0, W, H);

  // Helper: mm → px (template printed area assumed full A4 portrait 210x297mm)
  const mmX = (mm: number) => (mm / 210) * W;
  const mmY = (mm: number) => (mm / 297) * H;

  ctx.fillStyle = "#14143c";
  ctx.textAlign = "left";

  // Name
  ctx.font = `bold ${Math.round(mmY(5.5))}px Georgia, serif`;
  ctx.fillText(data.userName || "—", mmX(96), mmY(162));

  // Father / Husband
  ctx.font = `bold ${Math.round(mmY(5))}px Georgia, serif`;
  ctx.fillText(data.fatherName || "—", mmX(80), mmY(174));

  // Course / Blood Donation
  ctx.fillStyle = "#b41e1e";
  ctx.font = `bold ${Math.round(mmY(5))}px Georgia, serif`;
  ctx.fillText(data.type === "blood" ? "Blood Donation" : (data.courseName || "—"), mmX(120), mmY(195));

  // Duration + Grade
  ctx.fillStyle = "#14143c";
  ctx.font = `bold ${Math.round(mmY(4.5))}px Georgia, serif`;
  ctx.fillText(data.courseDuration || "—", mmX(68), mmY(213));
  ctx.fillText(data.grade || (data.scorePercent != null ? `${data.scorePercent}%` : "A"), mmX(138), mmY(213));

  // Signature + Seal images
  try {
    const sig = await loadImage(ngoSignatureUrl);
    ctx.drawImage(sig, mmX(58), mmY(240), mmX(42), mmY(14));
  } catch { /* ignore */ }
  try {
    const seal = await loadImage(ngoSealUrl);
    ctx.drawImage(seal, mmX(142), mmY(232), mmX(26), mmY(26));
  } catch { /* ignore */ }

  // Date
  ctx.font = `${Math.round(mmY(4))}px Georgia, serif`;
  ctx.fillText(data.date, mmX(36), mmY(263));

  // Cert ID (bottom-right)
  ctx.fillStyle = "#666";
  ctx.font = `${Math.round(mmY(3))}px sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(`Cert ID: ${data.certificateId}`, mmX(195), mmY(289));

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
