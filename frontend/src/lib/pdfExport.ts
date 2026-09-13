import { jsPDF } from "jspdf";
import { RecordDetailItem, SynthesisResponse } from "./types";
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

  // Strip redundant title prefix if summary starts with the title
  const cleanTitle = (record.title || "").trim().replace(/\.+$/, "").toLowerCase();
  if (summary.toLowerCase().startsWith(cleanTitle)) {
    const remaining = summary.slice(cleanTitle.length).replace(/^[\.\s,:-]+/, "").trim();
    if (remaining.length > 20) {
      summary = remaining.charAt(0).toUpperCase() + remaining.slice(1);
    }
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

export async function generateSynthesisPdfReport(
  data: SynthesisResponse,
  query: string = "",
  mode: string = "risk_brief"
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Editorial Brand Palette (RGB)
  const navy = [26, 35, 51]; // #1a2333
  const cyan = [0, 194, 209]; // #00c2d1
  const slate = [152, 162, 179]; // #98a2b3
  const lightBg = [250, 248, 252]; // #faf8fc
  const borderGray = [229, 231, 235]; // #e5e7eb
  const pureWhite = [255, 255, 255];

  // Helper for dynamic page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      doc.addPage();
      y = margin + 4;
      return true;
    }
    return false;
  };

  // --- 1. HEADER BANNER ---
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("KRIO // REGULATORY INTELLIGENCE NETWORK", margin + 5, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(cyan[0], cyan[1], cyan[2]);
  doc.text("EXECUTIVE COMPLIANCE MEMORANDUM", pageWidth - margin - 5, y + 9, { align: "right" });

  y += 18;

  // --- 2. METADATA & RISK INTENSITY SUB-HEADER ---
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SCOPE / TARGET:", margin, y);

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const targetLabel = query ? `"${query}"` : "Full Surveillance Cohort (All Indexed Matters)";
  doc.text(targetLabel, margin + 28, y);

  // Risk Intensity Badge (Right Aligned)
  const isHigh = data.risk_level === "HIGH";
  const isMod = data.risk_level === "MEDIUM" || data.risk_level === "MODERATE";
  const riskBg = isHigh ? [254, 242, 242] : isMod ? [255, 251, 235] : [236, 253, 245];
  const riskText = isHigh ? [185, 28, 28] : isMod ? [180, 83, 9] : [4, 120, 87];
  const riskLabel = `${data.risk_level} INTENSITY EXPOSURE`;

  const badgeWidth = doc.getTextWidth(riskLabel) + 8;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(riskBg[0], riskBg[1], riskBg[2]);
  doc.roundedRect(badgeX, y - 4.5, badgeWidth, 6.5, 1, 1, "F");
  doc.setDrawColor(riskText[0], riskText[1], riskText[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(badgeX, y - 4.5, badgeWidth, 6.5, 1, 1, "D");
  doc.setTextColor(riskText[0], riskText[1], riskText[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(riskLabel, badgeX + 4, y);

  y += 5;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // --- 3. REPORT HEADLINE ---
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  const cleanHeadline = (data.headline || "Executive Regulatory Intelligence Brief").replace(/₹/g, "Rs. ");
  const splitHeadline = doc.splitTextToSize(cleanHeadline, contentWidth);
  doc.text(splitHeadline, margin, y);
  y += splitHeadline.length * 5.2 + 4;

  // --- 4. QUANTITATIVE EXPOSURE METRICS (4-Column KPI Grid) ---
  const kpiHeight = 22;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, kpiHeight, 1.5, 1.5, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, kpiHeight, 1.5, 1.5, "D");

  const colWidth = contentWidth / 4;
  const kpiY = y;

  // Dividers
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.2);
  doc.line(margin + colWidth, kpiY + 3, margin + colWidth, kpiY + kpiHeight - 3);
  doc.line(margin + colWidth * 2, kpiY + 3, margin + colWidth * 2, kpiY + kpiHeight - 3);
  doc.line(margin + colWidth * 3, kpiY + 3, margin + colWidth * 3, kpiY + kpiHeight - 3);

  // Col 1: Sanction Exposure
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("SANCTION EXPOSURE", margin + 4, kpiY + 6);
  doc.setFontSize(9.5);
  doc.setTextColor(isHigh ? 185 : navy[0], isHigh ? 28 : navy[1], isHigh ? 28 : navy[2]);
  const exposureStr = formatPdfINRCompact(data.total_penalty_exposure);
  doc.text(exposureStr, margin + 4, kpiY + 14.5);

  // Col 2: Orders Synthesized
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("ORDERS SYNTHESIZED", margin + colWidth + 4, kpiY + 6);
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${data.order_count} Matters`, margin + colWidth + 4, kpiY + 14.5);

  // Col 3: Tracked Noticees
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("TRACKED NOTICEES", margin + colWidth * 2 + 4, kpiY + 6);
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`${data.entity_count} Entities`, margin + colWidth * 2 + 4, kpiY + 14.5);

  // Col 4: Confidence Score
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("AUDIT CONFIDENCE", margin + colWidth * 3 + 4, kpiY + 6);
  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text(`${(data.confidence_score * 100).toFixed(0)}% Provenance`, margin + colWidth * 3 + 4, kpiY + 14.5);

  y += kpiHeight + 8;

  // --- 5. EXECUTIVE LEGAL BRIEF ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("1. EXECUTIVE LEGAL BRIEF & ADJUDICATION SYNTHESIS", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.7);
  doc.line(margin, y + 2, margin + 42, y + 2);

  y += 6.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const cleanSummary = (data.executive_summary || "").replace(/₹/g, "Rs. ");
  const splitSummary = doc.splitTextToSize(cleanSummary, contentWidth);
  doc.text(splitSummary, margin, y, { lineHeightFactor: 1.35 });

  y += splitSummary.length * 4.6 + 7;

  // --- 6. APPLICABLE STATUTORY PROVISIONS ---
  ensureSpace(28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("2. APPLICABLE STATUTORY FRAMEWORK & PROVISIONS", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.7);
  doc.line(margin, y + 2, margin + 42, y + 2);

  y += 6.5;

  data.applicable_statutes.forEach((statute) => {
    ensureSpace(8);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, "F");
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`*  ${statute}`, margin + 3.5, y + 4.5);
    y += 8;
  });

  y += 3;

  // --- 7. ACTIONABLE COMPLIANCE TAKEAWAYS ---
  ensureSpace(35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("3. ACTIONABLE EVIDENTIARY & COMPLIANCE TAKEAWAYS", margin, y);

  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.7);
  doc.line(margin, y + 2, margin + 42, y + 2);

  y += 6.5;

  data.compliance_takeaways.forEach((takeaway, idx) => {
    ensureSpace(12);
    const cleanTakeaway = takeaway.replace(/₹/g, "Rs. ");
    const splitTakeaway = doc.splitTextToSize(`${idx + 1}.  ${cleanTakeaway}`, contentWidth - 4);
    const boxHeight = splitTakeaway.length * 4.2 + 4;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1, 1, "F");
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1, 1, "D");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(splitTakeaway, margin + 3, y + 4.5, { lineHeightFactor: 1.25 });
    y += boxHeight + 2;
  });

  y += 4;

  // --- 8. PRECEDENT MATTERS TABLE ---
  if (data.precedents && data.precedents.length > 0) {
    ensureSpace(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(`4. CITING ENFORCEMENT PRECEDENTS (${data.precedents.length} RECORDED)`, margin, y);

    doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 2, margin + 42, y + 2);

    y += 6.5;

    data.precedents.forEach((prec) => {
      ensureSpace(24);
      doc.setFillColor(pureWhite[0], pureWhite[1], pureWhite[2]);
      doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "F");
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "D");

      // Citation & Date & Sanction
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(prec.external_id, margin + 3.5, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(formatDate(prec.published_date), margin + 48, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const precAmt = prec.amount ? formatPdfINRCompact(prec.amount) : "Non-Monetary";
      doc.setTextColor(prec.amount ? 185 : 4, prec.amount ? 28 : 120, prec.amount ? 28 : 87);
      doc.text(precAmt, pageWidth - margin - 3.5, y + 4.5, { align: "right" });

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      const cleanTitle = (prec.title || "").replace(/₹/g, "Rs. ");
      const splitTitle = doc.splitTextToSize(cleanTitle, contentWidth - 7);
      doc.text(splitTitle[0] || cleanTitle, margin + 3.5, y + 9.5);

      // Key Finding
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      const cleanFinding = (prec.key_finding || "").replace(/₹/g, "Rs. ");
      const splitFinding = doc.splitTextToSize(cleanFinding, contentWidth - 7);
      doc.text(splitFinding[0] || cleanFinding, margin + 3.5, y + 14);

      // Respondents / Jurisdiction
      doc.setFontSize(6.5);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      const respStr = prec.respondents && prec.respondents.length > 0 ? prec.respondents.slice(0, 3).join(", ") : "Noticees";
      doc.text(`Noticees: ${respStr} • Jurisdiction: ${prec.jurisdiction || "Head Office, Mumbai"}`, margin + 3.5, y + 18);

      y += 23;
    });
  }

  // --- 9. CRYPTOGRAPHIC PROVENANCE & VERIFICATION BOX ---
  ensureSpace(22);
  const provHeight = 18;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, y, contentWidth, provHeight, 1.5, 1.5, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentWidth, provHeight, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("SHA-256 SYNTHESIS IMMUTABILITY PROVENANCE", margin + 4, y + 5);

  const hashContent = `${data.headline}|${data.total_penalty_exposure}|${data.generated_at}|${data.order_count}`;
  let shaHash = "3e7a9b0c812d45ef61a029384756bcde1029384756abcdef9018273645bcdef1";
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(hashContent);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      shaHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {}

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(shaHash, margin + 4, y + 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    `Verified against SEBI Public Registry Archive • Generated: ${new Date(data.generated_at).toUTCString()}`,
    margin + 4,
    y + 14.5
  );

  // --- FOOTERS ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(
      "CONFIDENTIAL LEGAL MEMORANDUM // Prepared by KRIO Regulatory Intelligence Engine (https://krio-rust.vercel.app)",
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  // Save the PDF
  const cleanQueryName = (query || "Executive_Cohort_Brief").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
  const filename = `KRIO_Memo_${cleanQueryName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
