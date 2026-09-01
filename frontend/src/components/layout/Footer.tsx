import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, FileText, Database, Scale, ArrowUpRight } from "lucide-react";
import { MascotSentinel } from "@/components/motion/MascotSentinel";
import { getDocsUrl } from "@/lib/api";

export function Footer() {
  return (
    <footer className="w-full bg-brivo-void border-t border-white/10 text-brivo-slate py-16 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 max-w-[24px] max-h-[24px] flex items-center justify-center shrink-0">
                <Image
                  src="/k_glyph_white.png"
                  alt="KRIO Logo"
                  width={24}
                  height={24}
                  style={{ width: "24px", height: "24px" }}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="font-semibold text-brivo-paper tracking-tight text-sm">
                KRIO<span className="text-brivo-slate font-light">.LEXGOV</span>
              </span>
            </div>
            <p className="text-xs text-brivo-slate max-w-md leading-relaxed font-sans">
              Regulatory enforcement and adjudication intelligence engine indexing publicly available orders published by the Securities and Exchange Board of India (SEBI). Built with SHA-256 provenance tracking, full-text vector search, and relational entity linking.
            </p>
            <div className="flex items-center gap-3 text-[0.65rem] font-mono text-brivo-slate/70 pt-2">
              <span>N°00 // COMPLIANCE</span>
              <span>•</span>
              <span>PUBLIC REGULATORY DISCLOSURES</span>
              <span>•</span>
              <span>ROBOTS.TXT COMPLIANT</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs text-brivo-paper uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explorer" className="hover:text-brivo-cyan transition-colors flex items-center gap-1">
                  <span>Record Explorer</span>
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-brivo-cyan transition-colors flex items-center gap-1">
                  <span>Analytics & Trends</span>
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-brivo-cyan transition-colors flex items-center gap-1">
                  <span>Crawler Job Monitor</span>
                </Link>
              </li>
              <li>
                <Link href="/api-explorer" className="hover:text-brivo-cyan transition-colors flex items-center gap-1">
                  <span>Interactive API Console</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs text-brivo-paper uppercase tracking-wider">Specifications</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a href={getDocsUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brivo-cyan transition-colors flex items-center gap-1">
                  <span>OpenAPI 3.1 Spec</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-brivo-slate/60">
                  SourceAdapter RFC-04
                </span>
              </li>
              <li>
                <span className="text-brivo-slate/60">
                  Deduplication Engine
                </span>
              </li>
              <li>
                <span className="text-brivo-slate/60">
                  PostgreSQL GIN tsvector
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center Mascot & Emblem Graphic */}
        <div className="pt-8 border-t border-white/5 flex flex-col items-center justify-center space-y-2">
          <MascotSentinel />
          <span className="font-mono text-[0.65rem] tracking-[0.25em] text-brivo-slate uppercase">
            Precision Becomes Clarity
          </span>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.7rem] text-brivo-slate font-mono">
          <p>© {new Date().getFullYear()} Krio Intelligence Ltd. Public Domain Regulatory Intelligence.</p>
          <div className="flex items-center gap-6">
            <span>Rate Limited: 1.0 req/sec</span>
            <span>SHA-256 Digest Provenance</span>
            <span>PostgreSQL 16 FTS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
