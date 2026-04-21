const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

const tmpl = "data:image/jpeg;base64," + fs.readFileSync("src/assets/certificate-template.jpg").toString("base64");
const seal = "data:image/png;base64," + fs.readFileSync("src/assets/ngo-seal.png").toString("base64");
const sig  = "data:image/png;base64," + fs.readFileSync("src/assets/ngo-signature.png").toString("base64");

const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
const pw = 210, ph = 297;
doc.addImage(tmpl, "JPEG", 0, 0, pw, ph);

doc.setTextColor(20,20,60);
doc.setFont("times","bold");
doc.setFontSize(13);
doc.text("Ram Kumar Sharma", 92, 144);
doc.setFontSize(12);
doc.text("Suresh Kumar Sharma", 75, 156);
doc.setFontSize(12);
doc.setTextColor(180,30,30);
doc.text("Computer Operator", 145, 178);
doc.setTextColor(20,20,60);
doc.setFontSize(11);
doc.text("6 Months", 65, 200);
doc.text("A+ (85%)", 138, 200);
doc.addImage(sig, "PNG", 58, 218, 45, 16);
doc.addImage(seal, "PNG", 130, 213, 32, 32);
doc.setFont("times","normal");
doc.setFontSize(10);
doc.text("21 April 2026", 38, 268);
doc.setFontSize(8);
doc.setTextColor(100,100,100);
doc.text("Cert ID: LSF-TEST-12345", pw-15, ph-8, { align: "right" });

fs.writeFileSync("/tmp/cert_qa.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("OK");
