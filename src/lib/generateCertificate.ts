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
  doc.text(data.userName || "—", 92, 144);

  // Father / Husband name
  doc.setFontSize(12);
  doc.text(data.fatherName || "—", 75, 156);

  // Course name OR "Blood Donation"
  doc.setFontSize(12);
  doc.setTextColor(180, 30, 30);
  if (data.type === "blood") {
    doc.text("Blood Donation", 145, 178);
  } else {
    doc.text(data.courseName || "—", 145, 178);
  }

  // Duration
  doc.setTextColor(20, 20, 60);
  doc.setFontSize(11);
  doc.text(data.courseDuration || "—", 65, 200);

  // Grade
  doc.text(data.grade || (data.scorePercent != null ? `${data.scorePercent}%` : "A"), 138, 200);

  // ─── Authentication overlays: Signature (LEFT) + Seal (RIGHT) ──────
  // Signature on the left, above "President's Signature" line
  try {
    doc.addImage(ngoSignatureUrl, "PNG", 58, 218, 45, 16);
  } catch { /* ignore */ }

  // Round NGO Seal on the right, above "Seal of NGO" line
  try {
    doc.addImage(ngoSealUrl, "PNG", 130, 213, 32, 32);
  } catch { /* ignore */ }

  // ─── Date + Cert ID ────────────────────────────────────────────────
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 60);
  doc.text(data.date, 38, 268);

  // Unique Certificate ID — bottom right (small, doesn't break design)
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Cert ID: ${data.certificateId}`, pw - 15, ph - 8, { align: "right" });

  return doc;
}

/* Ashoka Chakra — 24 spokes navy wheel */
function drawAshokaChakra(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, r * 0.25);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    doc.line(cx, cy, x2, y2);
  }
}

/* Stylised Chhattisgarh state map watermark (low-opacity tricolor blocks)
   Approximated as a simplified polygon filled with three horizontal bands. */
function drawChhattisgarhWatermark(doc: jsPDF, cx: number, cy: number, w: number) {
  // Very faint
  const h = w * 1.05;
  const left = cx - w / 2;
  const top = cy - h / 2;
  // Saffron / white / green bands as background squares (clipped visually)
  // jsPDF lacks clipping easily—use very light fills shaped like CG outline approximation (diamond-ish).
  // Polygon points (approximate CG silhouette, normalised 0..1 in w x h bbox)
  const pts: [number, number][] = [
    [0.45, 0.02], [0.62, 0.04], [0.78, 0.12], [0.86, 0.25], [0.92, 0.42],
    [0.95, 0.6], [0.85, 0.74], [0.78, 0.85], [0.62, 0.92], [0.5, 0.98],
    [0.36, 0.95], [0.22, 0.86], [0.12, 0.72], [0.06, 0.55], [0.05, 0.38],
    [0.12, 0.22], [0.24, 0.1], [0.35, 0.04],
  ];
  // Draw three colored bands then re-stroke polygon outline
  // Top band (saffron)
  doc.setFillColor(255, 220, 180);
  drawClippedBand(doc, pts, left, top, w, h, 0, 0.33);
  doc.setFillColor(245, 245, 245);
  drawClippedBand(doc, pts, left, top, w, h, 0.33, 0.66);
  doc.setFillColor(200, 240, 200);
  drawClippedBand(doc, pts, left, top, w, h, 0.66, 1);

  // Outline
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.4);
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    doc.line(left + x1 * w, top + y1 * h, left + x2 * w, top + y2 * h);
  }

  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("CHHATTISGARH", cx, cy + 2, { align: "center" });
}

/* Approximate band fill: draws the polygon as one filled shape limited to a vertical band.
   Since jsPDF clipping is awkward, we just fill the full polygon with each color but use
   thin overlapping rectangles within the band region for a layered effect. */
function drawClippedBand(
  doc: jsPDF,
  pts: [number, number][],
  left: number,
  top: number,
  w: number,
  h: number,
  yStart: number,
  yEnd: number,
) {
  // Use jsPDF triangle/lines approach: build a horizontal-strip approximation
  const strips = 30;
  for (let s = 0; s < strips; s++) {
    const t = yStart + ((yEnd - yStart) * s) / strips;
    const t2 = yStart + ((yEnd - yStart) * (s + 1)) / strips;
    const yMid = (t + t2) / 2;
    // Find polygon x-range at yMid by scanline
    const ys = yMid;
    let xMin = 1, xMax = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= ys && y2 > ys) || (y2 <= ys && y1 > ys)) {
        const xi = x1 + ((ys - y1) / (y2 - y1)) * (x2 - x1);
        if (xi < xMin) xMin = xi;
        if (xi > xMax) xMax = xi;
      }
    }
    if (xMax > xMin) {
      doc.rect(left + xMin * w, top + t * h, (xMax - xMin) * w, (t2 - t) * h, "F");
    }
  }
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
  ctx.fillStyle = "#FFFDF5";
  ctx.fillRect(0, 0, W, H);

  // Tiranga edge bars
  ctx.fillStyle = "#FF9933"; ctx.fillRect(0, 0, W, 24); ctx.fillRect(0, 0, 24, H);
  ctx.fillStyle = "#138808"; ctx.fillRect(0, H - 24, W, 24); ctx.fillRect(W - 24, 0, 24, H);

  // Inner frames
  ctx.strokeStyle = "#1a237e"; ctx.lineWidth = 5; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "#FF8C00"; ctx.lineWidth = 2; ctx.strokeRect(52, 52, W - 104, H - 104);

  // Watermark CG state (very faint)
  ctx.save();
  ctx.globalAlpha = 0.18;
  drawCgWatermarkCanvas(ctx, W / 2, H / 2 + 30, 520);
  ctx.restore();

  // Ashoka Chakra top center
  drawAshokaChakraCanvas(ctx, W / 2, 130, 50);

  // NGO Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#138808";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(NGO_NAME_HI, W / 2, 215);
  ctx.fillStyle = "#444";
  ctx.font = "20px sans-serif";
  ctx.fillText(NGO_SHORT, W / 2, 245);
  ctx.fillStyle = "#B40000";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(NGO_REG, W / 2, 270);

  // Divider
  ctx.strokeStyle = "#C8AA64"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(180, 290); ctx.lineTo(W - 180, 290); ctx.stroke();

  // Title
  ctx.fillStyle = "#1a237e";
  ctx.font = "bold 56px serif";
  ctx.fillText("Certificate of Completion", W / 2, 350);
  ctx.fillStyle = "#555";
  ctx.font = "26px sans-serif";
  ctx.fillText("कौशल विकास प्रमाणपत्र", W / 2, 385);

  // Photo frame (left)
  const pX = 130, pY = 440, pW = 200, pH = 240;
  ctx.fillStyle = "#F2F2F2"; ctx.fillRect(pX, pY, pW, pH);
  ctx.strokeStyle = "#1a237e"; ctx.lineWidth = 3; ctx.strokeRect(pX, pY, pW, pH);
  if (data.userPhotoUrl) {
    try {
      const img = await loadImage(data.userPhotoUrl);
      ctx.drawImage(img, pX + 4, pY + 4, pW - 8, pH - 8);
    } catch { /* keep placeholder */ }
  } else {
    ctx.fillStyle = "#999"; ctx.font = "20px sans-serif"; ctx.fillText("Photo", pX + pW / 2, pY + pH / 2);
  }
  ctx.fillStyle = "#555"; ctx.font = "16px sans-serif";
  ctx.fillText("Passport Photo", pX + pW / 2, pY + pH + 26);

  // Body (right of photo)
  ctx.textAlign = "left";
  const bX = pX + pW + 60;
  ctx.fillStyle = "#444"; ctx.font = "22px sans-serif";
  ctx.fillText("This is to certify that / प्रमाणित किया जाता है कि", bX, 470);

  ctx.fillStyle = "#136408"; ctx.font = "bold 48px serif";
  ctx.fillText(data.userName || "Student", bX, 530);

  ctx.fillStyle = "#444"; ctx.font = "22px sans-serif";
  ctx.fillText("ने निम्नलिखित पाठ्यक्रम सफलतापूर्वक पूर्ण किया है:", bX, 575);

  ctx.fillStyle = "#1a237e"; ctx.font = "bold 32px serif";
  ctx.fillText(`"${data.courseName}"`, bX, 620);

  if (data.courseDuration) {
    ctx.fillStyle = "#B45000"; ctx.font = "bold 22px sans-serif";
    ctx.fillText(`अवधि / Duration: ${data.courseDuration}`, bX, 660);
  }

  ctx.fillStyle = "#222"; ctx.font = "22px sans-serif";
  ctx.fillText(`प्राप्तांक / Score: ${data.scorePercent}%`, bX, 700);

  // Footer Date (left)
  ctx.textAlign = "center";
  ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, H - 150); ctx.lineTo(380, H - 150); ctx.stroke();
  ctx.fillStyle = "#444"; ctx.font = "18px sans-serif";
  ctx.fillText(`Date / दिनांक: ${data.date}`, 250, H - 125);

  // Real seal + signature images (bottom-right)
  try {
    const sealImg = await loadImage(ngoSealUrl);
    const sealSize = 170;
    const sealCx = W - 100 - sealSize / 2;
    const sealCy = H - 220;
    ctx.drawImage(sealImg, sealCx - sealSize / 2, sealCy - sealSize / 2, sealSize, sealSize);

    const sigImg = await loadImage(ngoSignatureUrl);
    const sigW = 200, sigH = 90;
    const sigX = sealCx - sealSize / 2 - sigW + 10;
    const sigY = H - 200;
    ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);

    // Signature line under both
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sigX, H - 110); ctx.lineTo(W - 100, H - 110); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#444"; ctx.font = "16px sans-serif";
    ctx.fillText("Authorised Signatory / अधिकृत हस्ताक्षर", (sigX + W - 100) / 2, H - 90);
    ctx.fillStyle = "#888"; ctx.font = "13px sans-serif";
    ctx.fillText("लाइव शो फाउंडेशन (Live Show Foundation)", (sigX + W - 100) / 2, H - 72);
  } catch { /* ignore */ }

  // Cert ID
  ctx.fillStyle = "#1a237e"; ctx.font = "bold 18px sans-serif";
  ctx.fillText(`Certificate ID: ${data.certificateId}`, W / 2, H - 55);
  ctx.fillStyle = "#999"; ctx.font = "12px sans-serif";
  ctx.fillText("Verify authenticity at merabharatdukaan.lovable.app", W / 2, H - 38);

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

function drawAshokaChakraCanvas(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.strokeStyle = "#1a237e";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawCgWatermarkCanvas(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  const h = w * 1.05;
  const left = cx - w / 2;
  const top = cy - h / 2;
  const pts: [number, number][] = [
    [0.45, 0.02], [0.62, 0.04], [0.78, 0.12], [0.86, 0.25], [0.92, 0.42],
    [0.95, 0.6], [0.85, 0.74], [0.78, 0.85], [0.62, 0.92], [0.5, 0.98],
    [0.36, 0.95], [0.22, 0.86], [0.12, 0.72], [0.06, 0.55], [0.05, 0.38],
    [0.12, 0.22], [0.24, 0.1], [0.35, 0.04],
  ];
  // Tricolor bands clipped to polygon
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = left + x * w;
    const py = top + y * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#FF9933"; ctx.fillRect(left, top, w, h / 3);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(left, top + h / 3, w, h / 3);
  ctx.fillStyle = "#138808"; ctx.fillRect(left, top + (2 * h) / 3, w, h / 3);
  ctx.restore();

  // Outline
  ctx.strokeStyle = "#1a237e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = left + x * w;
    const py = top + y * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  // Label
  ctx.fillStyle = "#888";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CHHATTISGARH", cx, cy + 10);
}
