import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | KRIO LexGov",
  description: "Terms of Service and legal disclosures governing access to the KRIO public regulatory archive.",
};

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5 text-brivo-cyan" />
            REGULATORY OVERSIGHT // STATUTORY TERMS
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-brivo-navy">
            Terms and Conditions
          </h1>
          <p className="text-xs font-mono text-brivo-slate">
            Effective Date: September 2026 • Version 1.1
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-brivo-slate font-sans leading-relaxed">
          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">1. Independent Public Domain Repository</h2>
            <p>
              KRIO LexGov is an independent open-access regulatory intelligence system. KRIO is not owned, operated, or officially endorsed by the Securities and Exchange Board of India (SEBI), the Reserve Bank of India (RBI), or any government ministry.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">2. Non-Advisory Legal Disclaimer</h2>
            <p>
              The materials, structured summaries, and analytics published on KRIO are intended strictly for academic, research, journalistic, and informational purposes. Nothing on this website constitutes legal counsel, statutory financial advice, investment recommendations, or formal regulatory representation. Users must verify all enforcement orders against official gazette publications prior to judicial proceedings.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">3. Fair Use & API Terms</h2>
            <p>
              Users and automated clients are granted non-exclusive, revocable permission to query the public API subject to rate limits. High-frequency automated polling exceeding fair use thresholds is blocked to maintain availability for the general public.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">4. Intellectual Property & Primary Sources</h2>
            <p>
              The texts of statutory orders remain the property of the issuing regulatory bodies in the public domain. The custom search indexing algorithms, normalization pipelines, UI components, and software architectures are protected under the MIT Open Source license.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">5. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. For questions or notices regarding these terms, please contact <a href="mailto:Krio27180@gmail.com" className="text-brivo-navy font-mono font-medium hover:text-brivo-cyan underline">Krio27180@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
