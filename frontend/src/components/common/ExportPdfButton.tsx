"use client";

import React, { useState } from "react";
import { Download, FileText, Check, Loader2 } from "lucide-react";
import { RecordDetailItem } from "@/lib/types";
import { generateExecutivePdfMemo } from "@/lib/pdfExport";

interface ExportPdfButtonProps {
  record: RecordDetailItem;
  className?: string;
  variant?: "primary" | "secondary" | "compact";
}

export function ExportPdfButton({
  record,
  className = "",
  variant = "primary",
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsExporting(true);
      generateExecutivePdfMemo(record);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error("Failed to generate PDF memo:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
          downloaded
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : "bg-white hover:bg-brivo-paper border-brivo-navy/15 text-brivo-navy hover:border-brivo-cyan"
        } ${className}`}
        title="Export Executive Compliance Memo"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brivo-cyan" />
        ) : downloaded ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Download className="w-3.5 h-3.5 text-brivo-slate" />
        )}
        <span>{downloaded ? "Downloaded" : "PDF"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 ${
        downloaded
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : variant === "secondary"
          ? "bg-white hover:bg-brivo-paper border-brivo-navy/15 text-brivo-navy hover:border-brivo-cyan"
          : "bg-brivo-navy hover:bg-brivo-void text-brivo-paper border-brivo-navy hover:shadow-md"
      } ${className}`}
      title="Generate and download official compliance briefing (.pdf)"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin text-brivo-cyan" />
      ) : downloaded ? (
        <Check className="w-4 h-4 text-emerald-600" />
      ) : (
        <FileText className="w-4 h-4 text-brivo-cyan" />
      )}
      <span>{downloaded ? "Briefing Exported" : "Export Briefing (.pdf)"}</span>
    </button>
  );
}
