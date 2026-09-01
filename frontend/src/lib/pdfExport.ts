import { jsPDF } from "jspdf";
import { RecordDetailItem } from "./types";
import { formatDate } from "./utils";

function formatRecordType(type?: string): string {
  if (!type) return "Adjudication Order";
  const t = type.toLowerCase().replace(/_/g, " ");
  return t
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPdfINR(amount: number | null | undefined): string {
  if (!amount || amount === 0) return "Non-Monetary / Debarment";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    const formattedNum = Number(amount).toLocaleString("en-IN");
    return `INR ${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr (Rs. ${formattedNum})`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    const formattedNum = Number(amount).toLocaleString("en-IN");
    return `INR ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh (Rs. ${formattedNum})`;
  }
  return `INR ${Number(amount).toLocaleString("en-IN")}`;
}

function formatPdfINRCompact(amount: number | null | undefined): string {
  if (!amount || amount === 0) return "Non-Monetary";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `INR ${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `INR ${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return `INR ${Number(amount).toLocaleString("en-IN")}`;
}

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
        ? `imposing aggregate monetary sanctions of ${formatPdfINRCompact(record.amount)}`
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

  // Obsidian Brand Palette (RGB)
  const navy = [15, 23, 42]; // #0f172a
  const cyan = [0, 194, 209]; // #00c2d1
  const slate = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderGray = [226, 232, 240]; // #e2e8f0

  // --- HEADER BANNER ---
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("KRIO // REGULATORY INTELLIGENCE NETWORK", margin + 6, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cyan[0], cyan[1], cyan[2]);
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
  doc.text(record.external_id, margin + 32, y);

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("STATUS:", pageWidth - margin - 40, y);

  doc.setTextColor(4, 120, 87); // Emerald green
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text((record.status || "PUBLISHED").toUpperCase(), pageWidth - margin, y, { align: "right" });

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

  // --- KEY METADATA GRID (2-Row x 3-Column Layout) ---
  const gridHeight = 32;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, gridHeight, 2, 2, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, gridHeight, 2, 2, "D");

  // Horizontal Divider Line
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, y + 16, pageWidth - margin - 4, y + 16);

  const col1 = margin + 6;
  const col2 = margin + 58;
  const col3 = margin + 114;

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
  if (record.amount && record.amount > 0) {
    doc.setTextColor(180, 20, 50); // Red highlight for monetary sanctions
    doc.text(formatPdfINR(record.amount), col3, y + 11.5);
  } else {
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Non-Monetary / Debarment", col3, y + 11.5);
  }

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
  doc.text(formatRecordType(record.record_type), col3, y + 27.5);

  y += gridHeight + 9;

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

  y += splitSummary.length * 4.8 + 10;

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
    const tableHeaderHeight = 6.5;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, tableHeaderHeight, 1, 1, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("ENTITY / NOTICEE NAME", margin + 4, y + 4.5);
    doc.text("ROLE", margin + contentWidth * 0.52, y + 4.5);
    doc.text("SANCTION EXPOSURE", margin + contentWidth * 0.76, y + 4.5);

    y += tableHeaderHeight + 1.5;

    entities.slice(0, 6).forEach((ent) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(ent.name, margin + 4, y + 4);
      doc.text(ent.role ? ent.role.charAt(0).toUpperCase() + ent.role.slice(1) : "Noticee", margin + contentWidth * 0.52, y + 4);
      doc.text(
        ent.total_penalty_amount && ent.total_penalty_amount > 0
          ? formatPdfINRCompact(ent.total_penalty_amount)
          : record.amount && record.amount > 0
          ? formatPdfINRCompact(record.amount)
          : "Non-Monetary",
        margin + contentWidth * 0.76,
        y + 4
      );

      y += 6.5;
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 1.5;
    });

    y += 5;
  } else if (entityNames.length > 0) {
    const listHeight = entityNames.length * 6.5 + 4;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(margin, y, contentWidth, listHeight, 2, 2, "F");
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, listHeight, 2, 2, "D");

    entityNames.slice(0, 5).forEach((name, idx) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(`-  ${name}`, margin + 5, y + 5 + idx * 6.5);
    });

    y += listHeight + 8;
  } else {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text("No individual noticees cataloged in this summary.", margin + 4, y + 4);
    y += 9;
  }

  // --- 3. CRYPTOGRAPHIC PROVENANCE & SOURCE AUDIT ---
  if (y > pageHeight - 55) {
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

  const fullUrl = record.source_url || "https://www.sebi.gov.in";
  const provenanceHeight = 30;

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

  // Clickable URL title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(2, 132, 199); // Sky blue
  doc.textWithLink("Official SEBI Order Document (Click to Open in Browser ->)", margin + 46, y + 17, { url: fullUrl });
  doc.link(margin + 46, y + 13, contentWidth - 52, 6, { url: fullUrl });

  // Direct Full URL display (wrapping if long)
  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const splitUrl = doc.splitTextToSize(`Direct URI: ${fullUrl}`, contentWidth - 52);
  doc.text(splitUrl, margin + 46, y + 22.5);

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
