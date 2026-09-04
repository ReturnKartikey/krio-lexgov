import React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowUpRight, Github } from "lucide-react";

export const metadata = {
  title: "Contact | KRIO LexGov",
  description: "Contact KRIO LexGov at Krio27180@gmail.com or via GitHub.",
};

export default function ContactPage() {
  return (
    <div className="min-h-[85vh] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-brivo-navy">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-brivo-slate hover:text-brivo-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO ARCHIVE</span>
        </Link>

        <div className="space-y-4 border-b border-brivo-navy/10 pb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-brivo-navy tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
            DIRECT CONTACT // DESK
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-brivo-navy">
            Contact & Inquiries
          </h1>
          <p className="text-sm text-brivo-slate max-w-xl leading-relaxed font-sans">
            For all inquiries regarding regulatory data audits, API access, compliance notices, or public corrections, reach out directly via email or our GitHub repository.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Email */}
          <div className="p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs space-y-4 flex flex-col justify-between hover:border-brivo-cyan/50 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brivo-cyan/10 flex items-center justify-center text-brivo-navy">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">Direct Email</h3>
              <p className="text-xs text-brivo-slate leading-relaxed">
                For all general inquiries, dataset corrections, API access, and compliance correspondence.
              </p>
            </div>
            <a
              href="mailto:Krio27180@gmail.com"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-brivo-navy hover:text-brivo-cyan font-medium pt-2 transition-colors"
            >
              <span>Krio27180@gmail.com</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-brivo-cyan" />
            </a>
          </div>

          {/* GitHub */}
          <div className="p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs space-y-4 flex flex-col justify-between hover:border-brivo-cyan/50 transition-colors">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brivo-cyan/10 flex items-center justify-center text-brivo-navy">
                <Github className="w-4 h-4" />
              </div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">Source Repository</h3>
              <p className="text-xs text-brivo-slate leading-relaxed">
                Inspect open-source crawlers, schemas, and file issues on the official repository.
              </p>
            </div>
            <a
              href="https://github.com/ReturnKartikey/krio-lexgov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-brivo-navy hover:text-brivo-cyan font-medium pt-2 transition-colors"
            >
              <span>github.com/ReturnKartikey/krio-lexgov</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-brivo-cyan" />
            </a>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/60 border border-brivo-navy/10 space-y-2 text-xs text-brivo-slate font-sans leading-relaxed">
          <h4 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">Institutional Archival Note</h4>
          <p>
            All records in KRIO LexGov are indexed verbatim from public disclosures published by the Securities and Exchange Board of India (SEBI) under statutory regulatory transparency guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
