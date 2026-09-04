import React from "react";
import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";

export const metadata = {
  title: "Cookie Policy | KRIO LexGov",
  description: "Information on how KRIO uses essential local storage and technical cookies.",
};

export default function CookiePolicyPage() {
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
            <Cookie className="w-3.5 h-3.5 text-brivo-cyan" />
            DATA RETENTION // COOKIES
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-brivo-navy">
            Cookie Policy
          </h1>
          <p className="text-xs font-mono text-brivo-slate">
            Effective Date: September 2026 • Version 1.0
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-brivo-slate font-sans leading-relaxed">
          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">1. Strictly Essential Storage Only</h2>
            <p>
              KRIO LexGov adheres to a strict privacy-by-design architecture. We do not employ third-party advertising cookies, social media tracking pixels, or cross-domain analytics trackers.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">2. Technical Local Storage Usage</h2>
            <p>
              We utilize browser LocalStorage solely to preserve user interface preferences:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-brivo-slate">
              <li>Explorer view mode toggles (Grid Cards vs. Tabular Dossier layout).</li>
              <li>Filter pagination preferences (Orders per view: 10, 25, 50).</li>
              <li>Client-side search cache to avoid re-requesting static order definitions.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">3. Managing Client Preferences</h2>
            <p>
              You may clear your browser LocalStorage or reject cookies via your browser settings at any time. Doing so will simply reset interface view preferences to their system defaults without impeding access to public enforcement orders.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-xl bg-white border border-brivo-navy/10 shadow-xs">
            <h2 className="font-mono text-xs uppercase tracking-wider text-brivo-navy font-semibold">4. Inquiries</h2>
            <p>
              For questions regarding our minimal storage practices, please write directly to <a href="mailto:Krio27180@gmail.com" className="text-brivo-navy font-mono font-medium hover:text-brivo-cyan underline">Krio27180@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
