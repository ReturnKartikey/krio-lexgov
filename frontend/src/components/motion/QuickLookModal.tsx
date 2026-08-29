"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Scale,
  ShieldCheck,
  ArrowRight,
  Eye,
  Hash,
} from "lucide-react";
import { RecordListItem } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { HashDescramble } from "./HashDescramble";

interface QuickLookModalProps {
  record: RecordListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickLookModal({ record, isOpen, onClose }: QuickLookModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Space") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter" && record) {
        e.preventDefault();
        onClose();
        router.push(`/explorer/${record.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, record, onClose, router]);

  if (!record) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Frosted Glass Refraction Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-brivo-void/70 backdrop-blur-xl"
          />

          {/* Quick Look Card (macOS Finder style spring) */}
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-2xl bg-white border border-brivo-navy/15 rounded-2xl shadow-[0_25px_60px_-15px_rgba(26,35,51,0.3)] overflow-hidden z-10 flex flex-col"
          >
            {/* Header bar */}
            <div className="px-6 py-4 border-b border-brivo-navy/10 bg-brivo-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
                <span className="font-mono text-xs font-semibold text-brivo-navy tracking-tight uppercase">
                  QUICK LOOK // SEBI ADJUDICATION ORDER
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] font-mono text-brivo-slate hidden sm:inline">
                  Space or Esc to dismiss
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-brivo-navy/10 text-brivo-slate hover:text-brivo-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 bg-white">
              {/* Citation & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brivo-navy/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brivo-navy text-brivo-paper">
                    {record.external_id}
                  </span>
                  <span className="font-mono text-xs text-brivo-slate flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(record.published_date)}</span>
                  </span>
                </div>

                <span className="font-mono text-xs text-brivo-slate flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{record.jurisdiction || record.state || "Head Office, Mumbai"}</span>
                </span>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-medium text-brivo-navy font-sans leading-snug">
                  {record.title}
                </h3>
                <p className="text-xs text-brivo-slate leading-relaxed font-sans line-clamp-3">
                  {record.summary || "Adjudication order issued under SEBI enforcement statutory provisions."}
                </p>
              </div>

              {/* Sanction & Noticees Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-brivo-paper border border-brivo-navy/10">
                <div className="space-y-1">
                  <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                    Penalties Imposed
                  </span>
                  <span className="text-xl font-bold font-mono text-brivo-navy block">
                    {record.amount ? formatINR(record.amount) : "Non-Monetary"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                    Identified Noticees ({record.entity_names?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {record.entity_names?.slice(0, 3).map((name, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.2 rounded bg-white border border-brivo-navy/10 text-[0.65rem] font-mono text-brivo-navy"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* SHA-256 Provenance */}
              <div className="space-y-1.5">
                <span className="text-[0.65rem] font-mono text-brivo-slate uppercase block">
                  Cryptographic Digest Verification
                </span>
                <HashDescramble
                  hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full justify-between"
                />
              </div>
            </div>

            {/* Footer action bar */}
            <div className="px-6 py-4 border-t border-brivo-navy/10 bg-brivo-paper flex items-center justify-between">
              <span className="text-[0.65rem] font-mono text-brivo-slate hidden sm:inline">
                Press [Enter] to open full dossier
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={record.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>SEBI Portal</span>
                  <ExternalLink className="w-3 h-3 text-brivo-slate" />
                </a>

                <Link
                  href={`/explorer/${record.id}`}
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Open Full Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brivo-cyan" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
