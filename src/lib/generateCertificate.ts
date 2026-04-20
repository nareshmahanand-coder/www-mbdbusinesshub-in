import jsPDF from "jspdf";

export interface CertificateData {
  userName: string;
  courseName: string;
  scorePercent: number;
  date: string;
  certificateId: string;
  /** Course duration text e.g. "3 महीने का कोर्स" */
  courseDuration?: string;
  /** Data URL or remote URL of user's passport photo */
  userPhotoUrl?: string;
}

export function generateCertificateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LSF-${ts}-${rand}`;
}

/* NGO Constants */
const NGO_NAME_HI = "लाइव शो शिक्षा एवं सामाजिक कल्याण समिति";
const NGO_SHORT = "लाइव शो फाउंडेशन (Live Show Foundation)";
const NGO_REG = "Reg. No. 122202059372";

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 253, 245);
  doc.rect(0, 0, pw, ph, "F");

  // Tiranga outer border (saffron / white / green stack)
  doc.setFillColor(255, 153, 51); doc.rect(0, 0, pw, 6, "F");
  doc.setFillColor(19, 136, 8); doc.rect(0, ph - 6, pw, 6, "F");
  doc.setFillColor(255, 153, 51); doc.rect(0, 0, 6, ph, "F");
  doc.setFillColor(19, 136, 8); doc.rect(pw - 6, 0, 6, ph, "F");

  // Inner navy frame
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, pw - 20, ph - 20);
  doc.setDrawColor(255, 140, 0);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, pw - 26, ph - 26);

  // === Watermark: Chhattisgarh state outline (stylised) in tricolor ===
  drawChhattisgarhWatermark(doc, pw / 2, ph / 2 + 8, 70);

  // === Top center: Ashoka Chakra ===
  drawAshokaChakra(doc, pw / 2, 28, 9);

  // === NGO Header (top) ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(19, 136, 8);
  doc.text(NGO_NAME_HI, pw / 2, 44, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(NGO_SHORT, pw / 2, 50, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 0, 0);
  doc.text(NGO_REG, pw / 2, 55, { align: "center" });

  // Divider
  doc.setDrawColor(200, 170, 100);
  doc.setLineWidth(0.4);
  doc.line(40, 59, pw - 40, 59);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(26, 35, 126);
  doc.text("Certificate of Completion", pw / 2, 72, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text("कौशल विकास प्रमाणपत्र", pw / 2, 79, { align: "center" });

  // === Left: User Photo Frame ===
  const photoX = 25;
  const photoY = 90;
  const photoW = 35;
  const photoH = 42;
  doc.setDrawColor(26, 35, 126);
  doc.setLineWidth(0.8);
  doc.setFillColor(245, 245, 245);
  doc.rect(photoX, photoY, photoW, photoH, "FD");
  if (data.userPhotoUrl) {
    try {
      doc.addImage(data.userPhotoUrl, "JPEG", photoX + 1, photoY + 1, photoW - 2, photoH - 2);
    } catch {
      try { doc.addImage(data.userPhotoUrl, "PNG", photoX + 1, photoY + 1, photoW - 2, photoH - 2); } catch { /* ignore */ }
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
  }
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("Passport Photo", photoX + photoW / 2, photoY + photoH + 4, { align: "center" });

  // === Body (right of photo) ===
  const bodyX = photoX + photoW + 10;
  let by = 100;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("This is to certify that / प्रमाणित किया जाता है कि", bodyX, by);
  by += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(19, 100, 8);
  doc.text(data.userName || "Student", bodyX, by);
  by += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("ने निम्नलिखित पाठ्यक्रम सफलतापूर्वक पूर्ण किया है:", bodyX, by);
  by += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(26, 35, 126);
  doc.text(`"${data.courseName}"`, bodyX, by);
  by += 8;

  if (data.courseDuration) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(180, 80, 0);
    doc.text(`अवधि / Duration: ${data.courseDuration}`, bodyX, by);
    by += 7;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`प्राप्तांक / Score: ${data.scorePercent}%`, bodyX, by);

  // === Footer: Date (left) | Seal+Sign (right) | Cert ID (center bottom) ===
  const footerY = ph - 32;

  // Date - left
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(20, footerY, 75, footerY);
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date / दिनांक: ${data.date}`, 47.5, footerY + 4, { align: "center" });

  // Right: NGO Seal + Authorised Signatory
  const sealCx = pw - 40;
  const sealCy = footerY - 4;
  doc.setDrawColor(180, 0, 0);
  doc.setLineWidth(0.8);
  doc.circle(sealCx, sealCy, 13);
  doc.setLineWidth(0.3);
  doc.circle(sealCx, sealCy, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(180, 0, 0);
  doc.text("LIVE SHOW FOUNDATION", sealCx, sealCy - 3, { align: "center" });
  doc.setFontSize(5);
  doc.text("लाइव शो फाउंडेशन", sealCx, sealCy + 0.5, { align: "center" });
  doc.setFontSize(5);
  doc.setTextColor(26, 35, 126);
  doc.text("✓ OFFICIAL SEAL", sealCx, sealCy + 4, { align: "center" });

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(pw - 75, footerY + 6, pw - 20, footerY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("Authorised Signatory / अधिकृत हस्ताक्षर", pw - 47.5, footerY + 10, { align: "center" });

  // Cert ID center bottom
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(26, 35, 126);
  doc.text(`Certificate ID: ${data.certificateId}`, pw / 2, ph - 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Verify authenticity at merabharatdukaan.lovable.app", pw / 2, ph - 10, { align: "center" });

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

  // Right: Seal + Sign
  const sX = W - 230, sY = H - 180;
  ctx.strokeStyle = "#B40000"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(sX, sY, 65, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sX, sY, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#B40000"; ctx.font = "bold 11px sans-serif";
  ctx.fillText("LIVE SHOW FOUNDATION", sX, sY - 8);
  ctx.fillStyle = "#B40000"; ctx.font = "10px sans-serif";
  ctx.fillText("लाइव शो फाउंडेशन", sX, sY + 8);
  ctx.fillStyle = "#1a237e"; ctx.font = "bold 9px sans-serif";
  ctx.fillText("✓ OFFICIAL SEAL", sX, sY + 24);

  ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W - 360, H - 110); ctx.lineTo(W - 100, H - 110); ctx.stroke();
  ctx.fillStyle = "#444"; ctx.font = "16px sans-serif";
  ctx.fillText("Authorised Signatory / अधिकृत हस्ताक्षर", W - 230, H - 88);

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
