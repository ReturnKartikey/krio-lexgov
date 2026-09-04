import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | KRIO LexGov",
  description: "Privacy policy for KRIO Regulatory Intelligence engine and public indexing registry.",
};

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5 text-brivo-cyan" />
            LEGAL PROVENANCE // PRIVACY
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-brivo-navy">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-brivo-slate">
            Effective Date: September 2026 • Version 1.2
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-brivo-slate font-sans leading-relaxed">
          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">1. Scope & Public Regulatory Records</h2>
            <p>
              KRIO LexGov operates strictly as an autonomous public index and search utility for administrative orders, settlement proceedings, and adjudication rulings issued and publicly disseminated by statutory regulatory authorities, including the Securities and Exchange Board of India (SEBI).
            </p>
            <p>
              All enforcement dossiers, parties, entity names, registration codes, and penalty amounts indexed in this platform originate from official gazettes and regulatory portals made public by law under Indian administrative transparency regulations.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">2. Zero Personal Tracker Guarantee</h2>
            <p>
              KRIO does not maintain advertising trackers, cross-site telemetry, or behavioral fingerprinting. We do not sell, rent, or trade visitor queries or reading habits to third-party data brokers or marketing intermediaries.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">3. Server Telemetry & Rate Limiting</h2>
            <p>
              To protect the infrastructure against distributed denial-of-service (DDoS) events and aggressive automated scrapers, temporary transient network logs (including IP addresses, user agents, and request timestamps) are retained for a rolling 7-day period solely for firewall enforcement and rate limiting before automated permanent deletion.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">4. Cryptographic Provenance & Integrity</h2>
            <p>
              All primary source PDF records ingested into KRIO are hashed via SHA-256 upon initial retrieval to generate an immutable integrity digest. These hashes ensure that records displayed to legal practitioners, researchers, and market participants match the source document verbatim.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">5. Contacting the Compliance Officer</h2>
            <p>
              For statutory privacy inquiries or data governance questions, you may contact our legal desk directly at <a href="mailto:Krio27180@gmail.com" className="text-brivo-navy font-mono font-medium hover:text-brivo-cyan underline">Krio27180@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
