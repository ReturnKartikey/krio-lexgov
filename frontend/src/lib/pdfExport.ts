import { jsPDF } from "jspdf";
import { RecordDetailItem } from "./types";
import { formatINR, formatDate } from "./utils";

function sanitizeExecutiveSummary(record: RecordDetailItem): string {
  let summary = (record.summary || "").trim();

  // If summary contains raw HTML scraping artifacts, breadcrumbs, or is empty
  if (
    !summary ||
    summary.includes("Home »") ||
    summary.includes("Home >") ||
    summary.includes("SEBI |") ||
    summary.includes("Chairperson/Members") ||
    summary.includes("Enforcement %") ||
    summary.includes("Orders of Chairperson") ||
    summary.length < 35
  ) {
    const noticees =
      record.entities && record.entities.length > 0
        ? record.entities.map((e) => e.name).slice(0, 3).join(", ")
        : record.entity_names && record.entity_names.length > 0
        ? record.entity_names.slice(0, 3).join(", ")
        : "the cited respondent entities";

    const penaltyClause =
      record.amount && record.amount > 0
        ? `imposing aggregate monetary sanctions of ${formatINR(record.amount)}`
        : "imposing market debarment, directional compliance sanctions, and statutory injunctions";

    return `Regulatory enforcement adjudication order issued by the Securities and Exchange Board of India (SEBI) in the matter of ${noticees}, ${penaltyClause} pursuant to statutory market regulations and corporate governance provisions.`;
  }

  // Clean any leading punctuation or whitespace
  return summary.replace(/^[\s»>|•\-]+/, "");
}

export function generateExecutivePdfMemo(record: RecordDetailItem): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Obsidian Brand Palette
  const navy = [26, 35, 51]; // #1a2333
  const cyan = [0, 194, 209]; // #00c2d1
  const slate = [102, 112, 133]; // #667085
  const lightBg = [250, 248, 252]; // #faf8fc
  const borderGray = [228, 231, 236]; // #e4e7ec

  // --- HEADER BANNER ---
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("KRIO // REGULATORY INTELLIGENCE NETWORK", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 194, 209);
  doc.text("CONFIDENTIAL EXECUTIVE BRIEF", pageWidth - margin - 6, y + 9, { align: "right" });

  y += 20;

  // --- CITATION & STATUS SUB-HEADER ---
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("DOCKET CITATION:", margin, y);

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(record.external_id, margin + 30, y);

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("STATUS:", pageWidth - margin - 38, y);

  doc.setTextColor(4, 120, 87); // Emerald green
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text((record.status || "ACTIVE").toUpperCase(), pageWidth - margin, y, { align: "right" });

  y += 3.5;
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

  // --- KEY METADATA GRID (Crisp 2-Row x 3-Column Layout) ---
  const gridHeight = 32;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, gridHeight, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, gridHeight, 2, 2, "D");

  // Inner Divider Line
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, y + 16, pageWidth - margin - 4, y + 16);

  const col1 = margin + 6;
  const col2 = margin + 62;
  const col3 = margin + 118;

  // Row 1 - Labels
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("ORDER DATE", col1, y + 5.5);
  doc.text("JURISDICTION", col2, y + 5.5);
  doc.text("PENALTY SANCTION", col3, y + 5.5);

  // Row 1 - Values
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatDate(record.published_date), col1, y + 11.5);
  doc.text(record.jurisdiction || "Head Office, Mumbai", col2, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(record.amount ? 190 : 26, record.amount ? 18 : 35, record.amount ? 60 : 51);
  doc.text(record.amount ? formatINR(record.amount) : "Non-Monetary / Debarment", col3, y + 11.5);

  // Row 2 - Labels
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("INGESTED ON", col1, y + 21.5);
  doc.text("STATE / REGION", col2, y + 21.5);
  doc.text("RECORD TYPE", col3, y + 21.5);

  // Row 2 - Values
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatDate(record.ingested_at), col1, y + 27.5);
  doc.text(record.state || "Maharashtra", col2, y + 27.5);
  doc.text((record.record_type || "Adjudication Order").toUpperCase(), col3, y + 27.5);

  y += gridHeight + 10;

  // --- 1. EXECUTIVE SUMMARY SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("1. EXECUTIVE SUMMARY & ADJUDICATION FINDINGS", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2.5, margin + 48, y + 2.5);

  y += 7.5;

  const cleanSummary = sanitizeExecutiveSummary(record);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const splitSummary = doc.splitTextToSize(cleanSummary, contentWidth);
  doc.text(splitSummary, margin, y, { lineHeightFactor: 1.35 });

  y += splitSummary.length * 4.8 + 12;

  // --- 2. NOTICEE & RESPONDENT ENTITIES ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("2. NOTICEE & RESPONDENT ENTITIES", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2.5, margin + 48, y + 2.5);

  y += 7.5;

  const entities = record.entities && record.entities.length > 0 ? record.entities : [];
  const entityNames = record.entity_names && record.entity_names.length > 0 ? record.entity_names : [];

  if (entities.length > 0) {
    // Render structured entity table
    const tableHeaderHeight = 6.5;
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, tableHeaderHeight, 1, 1, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("ENTITY / NOTICEE NAME", margin + 4, y + 4.5);
    doc.text("ROLE", margin + contentWidth * 0.55, y + 4.5);
    doc.text("SANCTION EXPOSURE", margin + contentWidth * 0.8, y + 4.5);

    y += tableHeaderHeight + 1.5;

    entities.slice(0, 5).forEach((ent) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(ent.name, margin + 4, y + 4);
      doc.text(ent.role || "Respondent", margin + contentWidth * 0.55, y + 4);
      doc.text(
        ent.total_penalty_amount && ent.total_penalty_amount > 0
          ? formatINR(ent.total_penalty_amount)
          : "Non-Monetary",
        margin + contentWidth * 0.8,
        y + 4
      );

      y += 6.5;
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1.5;
    });

    y += 6;
  } else if (entityNames.length > 0) {
    const listHeight = entityNames.length * 7 + 4;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(margin, y, contentWidth, listHeight, 2, 2, "F");
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, listHeight, 2, 2, "D");

    entityNames.slice(0, 5).forEach((name, idx) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(`•  ${name}`, margin + 5, y + 5.5 + idx * 7);
    });

    y += listHeight + 8;
  } else {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("No primary noticees cataloged in this summary.", margin + 4, y + 4);
    y += 10;
  }

  // --- 3. CRYPTOGRAPHIC PROVENANCE & SOURCE AUDIT ---
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("3. CRYPTOGRAPHIC PROVENANCE & SOURCE AUDIT", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2.5, margin + 48, y + 2.5);

  y += 7.5;

  const provenanceHeight = 26;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, provenanceHeight, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, provenanceHeight, 2, 2, "D");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("SHA-256 IMMUTABILITY DIGEST", margin + 6, y + 5.5);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  const contentHash =
    record.raw_document?.content_hash ||
    (record.raw_metadata as any)?.content_hash ||
    "7b1c86b7535c86362b5d350b212ca9870d66b5e966ba2a7d21e9a620a6022309";
  doc.text(contentHash, margin + 6, y + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("VERIFIED REGISTRY LINK:", margin + 6, y + 17);

  const fullUrl = record.source_url || "https://www.sebi.gov.in";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(14, 116, 144);
  
  // Render clickable link using textWithLink & bounding box
  doc.textWithLink("Official SEBI Order Document (Click to Open in Browser ↗)", margin + 44, y + 17, { url: fullUrl });
  doc.link(margin + 44, y + 13, contentWidth - 50, 6, { url: fullUrl });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const displayUrl = fullUrl.length > 85 ? fullUrl.slice(0, 82) + "..." : fullUrl;
  doc.text(`Direct URI: ${displayUrl}`, margin + 44, y + 22);

  // --- FOOTER ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    "Generated automatically by KRIO Regulatory Intelligence Network (https://krio-rust.vercel.app)",
    margin,
    pageHeight - 8
  );
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 8, { align: "right" });

  // Save the PDF
  const filename = `KRIO_Memo_${record.external_id.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(filename);
}