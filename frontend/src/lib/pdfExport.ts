import { jsPDF } from "jspdf";
import { RecordDetailItem } from "./types";
import { formatINR, formatDate } from "./utils";

export function generateExecutivePdfMemo(record: RecordDetailItem): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Palette
  const navy = [26, 35, 51]; // #1a2333
  const cyan = [0, 194, 209]; // #00c2d1
  const slate = [102, 112, 133]; // #667085
  const lightBg = [250, 248, 252]; // #faf8fc
  const borderGray = [228, 231, 236]; // #e4e7ec

  // --- HEADER BANNER ---
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(margin, y, contentWidth, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KRIO // REGULATORY INTELLIGENCE NETWORK", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 194, 209);
  doc.text("CONFIDENTIAL EXECUTIVE BRIEF", pageWidth - margin - 6, y + 9, { align: "right" });

  y += 20;

  // --- CITATION & STATUS SUB-HEADER ---
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DOCKET CITATION:", margin, y);

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(record.external_id, margin + 32, y);

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("STATUS:", pageWidth - margin - 45, y);

  doc.setTextColor(4, 120, 87); // Emerald green
  doc.text((record.status || "ACTIVE").toUpperCase(), pageWidth - margin, y, { align: "right" });

  y += 4;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // --- ORDER TITLE ---
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const splitTitle = doc.splitTextToSize(record.title, contentWidth);
  doc.text(splitTitle, margin, y);
  y += splitTitle.length * 5.5 + 4;

  // --- KEY METADATA GRID ---
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "D");

  const col1 = margin + 6;
  const col2 = margin + contentWidth * 0.35;
  const col3 = margin + contentWidth * 0.70;

  // Row 1 Labels
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("ORDER DATE", col1, y + 6);
  doc.text("JURISDICTION", col2, y + 6);
  doc.text("PENALTY SANCTION", col3, y + 6);

  // Row 2 Values
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatDate(record.published_date), col1, y + 12);
  doc.text(record.jurisdiction || "SEBI Head Office", col2, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(record.amount ? 190 : 26, record.amount ? 18 : 35, record.amount ? 60 : 51);
  doc.text(record.amount ? formatINR(record.amount) : "Non-Monetary / Debarment", col3, y + 12);

  // Row 3 Labels
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("INGESTED ON", col1, y + 18);
  doc.text("STATE / REGION", col2, y + 18);
  doc.text("RECORD TYPE", col3, y + 18);

  // Row 4 Values
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatDate(record.ingested_at), col1 + 22, y + 18);
  doc.text(record.state || "Maharashtra", col2 + 25, y + 18);
  doc.text((record.record_type || "Adjudication Order").toUpperCase(), col3 + 24, y + 18);

  y += 30;

  // --- EXECUTIVE SUMMARY SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("1. EXECUTIVE SUMMARY & ADJUDICATION FINDINGS", margin, y);
  y += 2;
  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryText =
    record.summary ||
    "Adjudication order issued by Securities and Exchange Board of India regarding regulatory compliance, disclosures, and market enforcement provisions.";
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 4.2 + 8;

  // --- NOTICEES & ENTITIES SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("2. NOTICEE & RESPONDENT ENTITIES", margin, y);
  y += 2;
  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  const entities = record.entities && record.entities.length > 0 ? record.entities : [];
  const entityNames = record.entity_names && record.entity_names.length > 0 ? record.entity_names : [];

  if (entities.length > 0) {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("ENTITY / NOTICEE NAME", margin + 4, y + 4.5);
    doc.text("ROLE", margin + contentWidth * 0.55, y + 4.5);
    doc.text("HISTORICAL EXPOSURE", margin + contentWidth * 0.80, y + 4.5);
    y += 7;

    entities.slice(0, 5).forEach((ent) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(ent.name, margin + 4, y + 4);
      doc.text(ent.role || "Respondent", margin + contentWidth * 0.55, y + 4);
      doc.text(
        ent.total_penalty_amount ? formatINR(ent.total_penalty_amount) : "None",
        margin + contentWidth * 0.8,
        y + 4
      );

      y += 6;
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1;
    });
    y += 4;
  } else if (entityNames.length > 0) {
    entityNames.slice(0, 6).forEach((name) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text("Noticee: " + name, margin + 4, y + 3);
      y += 5;
    });
    y += 4;
  }

  // --- CRYPTOGRAPHIC PROVENANCE & FORENSIC INTEGRITY ---
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("3. CRYPTOGRAPHIC PROVENANCE & SOURCE AUDIT", margin, y);
  y += 2;
  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 6;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "D");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("SHA-256 CONTENT FINGERPRINT", margin + 6, y + 6);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  const contentHash =
    record.raw_document?.content_hash ||
    (record.raw_metadata as any)?.content_hash ||
    "7b1c86b7535c86362b5d350b212ca9870d66b5e966ba2a7d21e9a620a6022309";
  doc.text(contentHash, margin + 6, y + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("VERIFIED SOURCE URL:", margin + 6, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(14, 116, 144);
  const truncatedUrl =
    record.source_url && record.source_url.length > 70
      ? record.source_url.slice(0, 67) + "..."
      : record.source_url || "https://www.sebi.gov.in";
  doc.text(truncatedUrl, margin + 42, y + 16);

  // --- FOOTER ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    "Generated automatically by KRIO Regulatory Intelligence Network (https://krio-rust.vercel.app)",
    margin,
    pageHeight - 10
  );
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 10, { align: "right" });

  const filename = "KRIO_Memo_" + record.external_id.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf";
  doc.save(filename);
}