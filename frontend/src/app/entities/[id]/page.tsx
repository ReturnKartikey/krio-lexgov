import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Scale,
  Hash,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
} from "lucide-react";
import { MicroLabel } from "@/components/common/MicroLabel";
import { getEntityDetail } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export const revalidate = 0;

export default async function EntityDetailPage({ params }: PageProps) {
  let entity;
  try {
    entity = await getEntityDetail(params.id);
  } catch (err) {
    notFound();
  }

  if (!entity) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-brivo-navy/10 pb-4">
        <Link
          href="/explorer"
          className="text-xs font-mono text-brivo-slate hover:text-brivo-navy transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Records Explorer</span>
        </Link>
        <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/15 text-brivo-slate uppercase">
          Entity Dossier
        </span>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MicroLabel number="N°03" label="ENTITY PROFILE" />
          <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-mist border border-brivo-cyan/30 text-brivo-navy uppercase font-medium">
            {entity.entity_type}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-brivo-navy flex items-center gap-3 font-sans">
          {entity.entity_type === "individual" ? (
            <User className="w-8 h-8 text-brivo-navy" />
          ) : (
            <Building2 className="w-8 h-8 text-brivo-navy" />
          )}
          <span>{entity.name}</span>
        </h1>

        <p className="text-xs font-mono text-brivo-slate">
          Normalized Identifier: <code className="text-brivo-navy bg-brivo-paper border border-brivo-navy/10 px-1.5 py-0.5 rounded">{entity.normalized_name}</code>
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-white border border-brivo-navy/10 space-y-1 shadow-sm">
          <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">Total Orders</span>
          <span className="text-xl font-bold font-mono text-brivo-navy block">{entity.record_count}</span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-brivo-navy/10 space-y-1 shadow-sm">
          <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">Total Penalties</span>
          <span className="text-xl font-bold font-mono text-brivo-navy block">{formatINR(entity.total_penalty_amount)}</span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-brivo-navy/10 space-y-1 shadow-sm">
          <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">First Recorded</span>
          <span className="text-xs font-mono text-brivo-navy block">{formatDate(entity.first_seen)}</span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-brivo-navy/10 space-y-1 shadow-sm">
          <span className="text-[0.65rem] font-mono text-brivo-slate uppercase">Last Activity</span>
          <span className="text-xs font-mono text-brivo-navy block">{formatDate(entity.last_seen)}</span>
        </div>
      </div>

      {/* Historical Associated Orders */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-medium text-brivo-navy flex items-center gap-2">
          <Scale className="w-4 h-4 text-brivo-navy" />
          <span>Associated Regulatory Orders ({entity.recent_records?.length || 0})</span>
        </h2>

        <div className="space-y-3">
          {entity.recent_records?.map((record) => (
            <Link
              key={record.id}
              href={`/explorer/${record.id}`}
              className="block p-5 rounded-lg bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all group shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-semibold">
                      {record.external_id}
                    </span>
                    <span className="text-xs font-mono text-brivo-slate">{formatDate(record.published_date)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-brivo-navy group-hover:text-brivo-cyan transition-colors">
                    {record.title}
                  </h3>
                  <p className="text-xs text-brivo-slate line-clamp-1 leading-relaxed">
                    {record.summary || "No summary"}
                  </p>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between shrink-0">
                  <span className="text-sm font-semibold font-mono text-brivo-navy">
                    {formatINR(record.amount)}
                  </span>
                  <span className="text-[0.65rem] font-mono text-brivo-slate flex items-center gap-1 group-hover:text-brivo-navy mt-1">
                    <span>View Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
