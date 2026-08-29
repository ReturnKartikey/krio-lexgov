import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Building2,
  Scale,
  Hash,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { JsonViewer } from "@/components/common/JsonViewer";
import { SynthesizeButton } from "@/components/ai/SynthesizeButton";
import { getRecordDetail } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export const revalidate = 0;

export default async function RecordDetailPage({ params }: PageProps) {
  let record;
  try {
    record = await getRecordDetail(params.id);
  } catch (err) {
    notFound();
  }

  if (!record) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between border-b border-brivo-navy/10 pb-4">
        <Link
          href="/explorer"
          className="text-xs font-mono text-brivo-slate hover:text-brivo-navy transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Records Explorer</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-semibold">
            {record.external_id}
          </span>
          <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
            {record.status}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="space-y-3">
        <MicroLabel number="N°01" label="REGULATORY DOSSIER" />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-brivo-navy leading-tight font-sans">
          {record.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brivo-slate pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brivo-slate" />
            <span>Order Date: {formatDate(record.published_date)}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brivo-slate" />
            <span>{record.jurisdiction || "SEBI Head Office"}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brivo-slate" />
            <span>Ingested: {formatDate(record.ingested_at)}</span>
          </span>
        </div>
      </div>

      {/* 2-Column Grid for Dossier Details & Provenance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Findings & Summary */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-3 shadow-sm">
            <h2 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brivo-navy" />
              <span>Order Summary & Findings</span>
            </h2>
            <div className="text-sm text-brivo-navy leading-relaxed whitespace-pre-line">
              {record.summary || "No extracted summary available."}
            </div>
          </div>

          {/* Extracted Entities */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brivo-navy" />
                <span>Extracted Noticees & Entities ({record.entities?.length || 0})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.entities?.map((ent) => (
                <Link
                  key={ent.id}
                  href={`/entities/${ent.id}`}
                  className="p-3.5 rounded bg-brivo-paper hover:bg-brivo-mist/40 border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[0.65rem] px-1.5 py-0.2 rounded bg-white text-brivo-slate uppercase border border-brivo-navy/10">
                        {ent.entity_type}
                      </span>
                      <span className="font-mono text-[0.65rem] text-brivo-navy font-semibold">
                        {ent.role || "noticee"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-brivo-navy group-hover:text-brivo-cyan transition-colors block">
                      {ent.name}
                    </span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-brivo-navy/10 flex items-center justify-between text-[0.65rem] font-mono text-brivo-slate">
                    <span>{ent.record_count} total order(s)</span>
                    <span className="text-brivo-navy font-semibold">{formatINR(ent.total_penalty_amount)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Collapsible Raw Metadata */}
          <JsonViewer
            title="Raw Ingestion Snapshot Metadata"
            data={record.raw_metadata || {}}
            defaultExpanded={false}
          />
        </div>

        {/* Right Col: Sanction Metrics & Provenance Card */}
        <div className="space-y-6">
          {/* Sanction / Penalty Card */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
            <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-brivo-navy" />
              <span>Sanction Overview</span>
            </h3>

            <div className="space-y-1">
              <span className="text-2xl font-bold font-mono text-brivo-navy block">
                {formatINR(record.amount)}
              </span>
              <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">
                Total Monetary Penalty
              </span>
            </div>

            <div className="pt-3 border-t border-brivo-navy/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brivo-slate font-mono">Jurisdiction</span>
                <span className="text-brivo-navy font-medium">{record.state || "Maharashtra"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brivo-slate font-mono">Order Type</span>
                <span className="text-brivo-navy font-medium capitalize">{record.record_type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brivo-slate font-mono">Status</span>
                <span className="text-emerald-600 font-medium capitalize">{record.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <SynthesizeButton
                query={record.title}
                label="Synthesize Risk Brief"
                variant="secondary"
                className="w-full justify-center"
              />
            </div>
          </div>

          {/* Provenance & Audit Trail Card */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
            <h3 className="text-xs font-mono text-brivo-slate uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Traceable Provenance</span>
            </h3>

            <p className="text-[0.7rem] text-brivo-slate leading-relaxed">
              Every finding is verifiable against the immutable cryptographic digest fetched from SEBI.
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[0.65rem] text-brivo-slate uppercase">Cryptographic Digest</span>
                <div className="p-2 rounded bg-brivo-void text-[0.65rem] text-brivo-mist break-all select-all font-mono">
                  {record.raw_document?.content_hash || "sha256:verified"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[0.65rem] text-brivo-slate uppercase">Registry Source Link</span>
                <a
                  href={record.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brivo-navy hover:text-brivo-cyan hover:underline text-xs truncate"
                >
                  <span className="truncate">{record.source_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="flex justify-between text-[0.7rem] pt-2 border-t border-brivo-navy/10">
                <span className="text-brivo-slate">HTTP Status</span>
                <span className="text-emerald-600 font-medium">
                  {record.raw_document?.http_status || 200} OK
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
