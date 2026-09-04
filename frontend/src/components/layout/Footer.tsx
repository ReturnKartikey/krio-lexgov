"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getDocsUrl } from "@/lib/api";
import { MadeBySignature } from "@/components/motion/MadeBySignature";

const POLICY_ROUTES = ["/contact", "/cookie-policy", "/privacy-policy", "/terms"];

export function Footer() {
  const pathname = usePathname();
  const normalizedPath = (pathname || "").replace(/\/$/, "") || "/";
  const isPolicyPage = POLICY_ROUTES.includes(normalizedPath);

  return (
    <>
      {/* Editorial Scroll-Driven Signature Banner - Only on Legal & Policy routes */}
      {isPolicyPage && <MadeBySignature />}

      <footer className="w-full bg-brivo-void border-t border-white/10 text-brivo-slate py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand & Description */}
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
            </div>

            {/* Col 2: Specifications */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs text-brivo-paper uppercase tracking-wider">Specifications</h4>
              <ul className="space-y-2 text-xs font-mono">
                <li>
                  <a
                    href={getDocsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brivo-cyan transition-colors flex items-center gap-1"
                  >
                    <span>OpenAPI 3.1 Spec</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <span className="text-brivo-slate/60">SourceAdapter RFC-04</span>
                </li>
                <li>
                  <span className="text-brivo-slate/60">Deduplication Engine</span>
                </li>
                <li>
                  <span className="text-brivo-slate/60">PostgreSQL GIN tsvector</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Inquiries */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs text-brivo-paper uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/contact" className="hover:text-brivo-cyan transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="hover:text-brivo-cyan transition-colors">
                    Cookie policy
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-brivo-cyan transition-colors">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-brivo-cyan transition-colors">
                    Terms and conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.7rem] text-brivo-slate font-mono">
            <p>© {new Date().getFullYear()} Krio Intelligence Ltd. Public Domain Regulatory Intelligence.</p>
            <div className="flex items-center gap-4 text-brivo-slate/60">
              <span>Independent Public Domain Archive</span>
              <span>•</span>
              <span>Not Affiliated with SEBI</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
