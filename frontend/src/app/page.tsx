"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  Shield,
  Layers,
  Database,
  BarChart3,
  Scale,
  Hash,
  Clock,
  Sparkles,
  GitBranch,
  TerminalSquare,
  ArrowUpRight,
  FileText,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { MicroLabel } from "@/components/common/MicroLabel";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";
import { QuickLookModal } from "@/components/motion/QuickLookModal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { TiltCard } from "@/components/motion/TiltCard";
import { getRecords, getTrends, getProcessingStats, getHealth } from "@/lib/api";
import { formatINR, formatDate, truncateText } from "@/lib/utils";
import { gsap, ScrollTrigger, SplitType, animateHeroHeadline, animateCounter, prefersReducedMotion } from "@/lib/motion";

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalRecords: 39,
    totalPenalties: 68679350,
    totalEntities: 40,
    successRate: 100.0,
  });
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState("");
  const [quickLookRecord, setQuickLookRecord] = useState<any>(null);
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);

  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const heroWatermarkRef = useRef<HTMLDivElement>(null);
  const manifestoHeadingRef = useRef<HTMLHeadingElement>(null);

  // Fetch backend data
  useEffect(() => {
    async function loadData() {
      try {
        const [recordsRes, trendsRes, processingRes, healthRes] = await Promise.allSettled([
          getRecords({ page_size: 6 }),
          getTrends("month"),
          getProcessingStats(),
          getHealth(),
        ]);

        if (recordsRes.status === "fulfilled") {
          setRecentRecords(recordsRes.value.data);
          if (recordsRes.value.meta) {
            setStats((prev) => ({ ...prev, totalRecords: recordsRes.value.meta?.total || prev.totalRecords }));
          }
        }
        if (healthRes.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            totalRecords: healthRes.value.total_records || prev.totalRecords,
            totalEntities: healthRes.value.total_entities || prev.totalEntities,
          }));
        }
        if (trendsRes.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            totalPenalties: trendsRes.value.total_penalties_trend.current_value || prev.totalPenalties,
          }));
        }
        if (processingRes.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            successRate: processingRes.value.success_rate_percent || 100.0,
          }));
        }
      } catch (e) {
        // graceful fallback
      }
    }
    loadData();
  }, []);

  // Motion design animations via GSAP & ScrollTrigger
  useEffect(() => {
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Headline staggered line reveal animation
    if (heroHeadlineRef.current) {
      const lineElements = heroHeadlineRef.current.querySelectorAll(".hero-line");
      gsap.fromTo(
        lineElements,
        {
          opacity: 0,
          y: 35,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.85,
          stagger: 0.12,
          ease: "power4.out",
          clearProps: "filter,transform",
        }
      );
    }

    // 2. Parallax vertical drift for background giant 'K' watermark
    if (heroWatermarkRef.current) {
      gsap.to(heroWatermarkRef.current, {
        yPercent: 35,
        opacity: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: heroWatermarkRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }

    // 3. Staggered reveals for Section Headings and Cards
    const revealSections = document.querySelectorAll(".scroll-reveal-section");
    revealSections.forEach((section) => {
      gsap.fromTo(
        section.querySelectorAll(".scroll-reveal-item"),
        {
          opacity: 0,
          y: 28,
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.75,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "filter,transform",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            once: true,
          },
        }
      );
    });

    // 4. Sequential table row reveals
    const tableRows = document.querySelectorAll(".dispatch-table-row");
    if (tableRows.length > 0) {
      gsap.fromTo(
        tableRows,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".dispatch-table-container",
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const openAiWithQuery = (q: string) => {
    setAiInitialQuery(q);
    setIsAiModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col selection:bg-brivo-mist selection:text-brivo-navy">
      {/* 1. HERO SECTION */}
      <section className="relative pt-3 sm:pt-6 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Subtle Watermark in top right with Parallax Scroll */}
        <div
          ref={heroWatermarkRef}
          className="absolute top-2 right-6 sm:right-12 select-none pointer-events-none opacity-[0.06] hidden lg:block will-change-transform"
        >
          <Image
            src="/k_glyph.png"
            alt="Hero Watermark"
            width={340}
            height={340}
            className="w-72 h-72 xl:w-80 xl:h-80 object-contain filter contrast-125"
            priority
          />
        </div>

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div>
            <MicroLabel number="N°01" label="PUBLIC REGULATORY INTELLIGENCE" />
          </div>

          <h1
            ref={heroHeadlineRef}
            className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-[-0.035em] text-brivo-navy leading-[1.06] font-sans"
          >
            <span className="block hero-line">Precedent you can</span>
            <span className="block hero-line font-serif italic font-normal editorial-interactive-italic text-brivo-navy">
              prove.
            </span>
            <span className="block hero-line mt-2 sm:mt-3">Intelligence you can</span>
            <span className="block hero-line font-serif italic font-normal editorial-interactive-italic text-brivo-navy">
              defend.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-brivo-slate font-normal max-w-xl leading-relaxed">
            Krio Intelligence Explorer normalizes, indexes, and analyzes public enforcement orders from the Securities and Exchange Board of India (SEBI) with audit-grade provenance and full-text precision.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link href="/explorer">
              <MagneticButton className="px-6 py-3 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper font-medium text-xs tracking-wider uppercase flex items-center gap-2 shadow-sm hover:shadow-md group active:scale-95 transition-all">
                <span>Launch Explorer</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-brivo-cyan" />
              </MagneticButton>
            </Link>

            {/* AI Synthesizer Trigger Button */}
            <MagneticButton
              onClick={() => openAiWithQuery("")}
              className="px-6 py-3 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy font-medium text-xs tracking-wider uppercase flex items-center gap-2 shadow-sm hover:shadow-md hover:border-brivo-cyan/50 active:scale-95 group transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
              <span>Synthesize Precedents</span>
            </MagneticButton>

            <Link
              href="/analytics"
              className="px-4 py-2 text-brivo-slate hover:text-brivo-navy font-mono text-xs transition-colors flex items-center gap-1 group"
            >
              <span>Market Analytics</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. REGULATORY DATA SOURCE BADGES */}
      <section className="w-full border-y border-brivo-navy/10 bg-white py-8 px-4 sm:px-6 lg:px-8 scroll-reveal-section">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brivo-navy/5">
            <span className="text-[0.68rem] font-mono tracking-[0.2em] uppercase text-brivo-slate">
              PUBLIC REGULATORY ARCHIVE // OFFICIAL INDIAN REGULATORY DISCLOSURES
            </span>
            <span className="text-[0.68rem] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYNC ACTIVE</span>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs font-mono">
            <div className="scroll-reveal-item p-4 rounded-xl border border-brivo-navy/10 bg-brivo-paper/40 flex flex-col justify-between hover:border-brivo-navy/25 transition-all">
              <span className="text-[0.68rem] text-brivo-slate uppercase">Primary Source</span>
              <span className="text-sm font-semibold text-brivo-navy mt-1">SEBI Enforcement Orders</span>
              <span className="text-[0.68rem] text-emerald-600 font-normal mt-2">Ingested & Verified</span>
            </div>

            <div className="scroll-reveal-item p-4 rounded-xl border border-brivo-navy/10 bg-brivo-paper/40 flex flex-col justify-between hover:border-brivo-navy/25 transition-all">
              <span className="text-[0.68rem] text-brivo-slate uppercase">Exchange Filings</span>
              <span className="text-sm font-semibold text-brivo-navy mt-1">BSE Corporate Disclosures</span>
              <span className="text-[0.68rem] text-brivo-slate font-normal mt-2">Adapter Ready</span>
            </div>

            <div className="scroll-reveal-item p-4 rounded-xl border border-brivo-navy/10 bg-brivo-paper/40 flex flex-col justify-between hover:border-brivo-navy/25 transition-all">
              <span className="text-[0.68rem] text-brivo-slate uppercase">Market Surveillance</span>
              <span className="text-sm font-semibold text-brivo-navy mt-1">NSE Member Bulletins</span>
              <span className="text-[0.68rem] text-brivo-slate font-normal mt-2">Adapter Ready</span>
            </div>

            <div className="scroll-reveal-item p-4 rounded-xl border border-brivo-navy/10 bg-brivo-paper/40 flex flex-col justify-between hover:border-brivo-navy/25 transition-all">
              <span className="text-[0.68rem] text-brivo-slate uppercase">Corporate Filings</span>
              <span className="text-sm font-semibold text-brivo-navy mt-1">MCA-21 RoC Orders</span>
              <span className="text-[0.68rem] text-brivo-slate font-normal mt-2">Planned Roadmap</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EDITORIAL MANIFESTO SECTION */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 scroll-reveal-section">
        <div className="space-y-3 max-w-2xl">
          <MicroLabel number="N°02" label="THE OPERATING PRINCIPLE" />
          <h2
            ref={manifestoHeadingRef}
            className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.025em] text-brivo-navy leading-[1.12] font-sans"
          >
            Law was meant to be{" "}
            <span className="font-serif italic font-normal editorial-interactive-italic">
              public.
            </span>
            <br />
            We made it{" "}
            <span className="font-serif italic font-normal editorial-interactive-italic">
              computable.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-brivo-navy/10">
          <div className="scroll-reveal-item space-y-3 group">
            <span className="font-mono text-[0.7rem] text-brivo-slate uppercase tracking-wider block">
              01 / NORMALIZATION
            </span>
            <h3 className="text-base font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors">
              From Raw PDF to Clean Data
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Publicly available regulatory orders and unstructured disclosures are automatically converted into typed, schema-validated records.
            </p>
          </div>

          <div className="scroll-reveal-item space-y-3 group">
            <span className="font-mono text-[0.7rem] text-brivo-slate uppercase tracking-wider block">
              02 / PROVENANCE
            </span>
            <h3 className="text-base font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors">
              Cryptographic Provenance
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Every indexed order provides reproducible document verification and integrity tracking through SHA-256 cryptographic hashing.
            </p>
          </div>

          <div className="scroll-reveal-item space-y-3 group">
            <span className="font-mono text-[0.7rem] text-brivo-slate uppercase tracking-wider block">
              03 / FTS ENGINE
            </span>
            <h3 className="text-base font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors">
              Sub-millisecond Search
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              GIN vector search and PostgreSQL Trigram indexes deliver sub-millisecond lexical queries, typo tolerance, and entity matching.
            </p>
          </div>

          <div className="scroll-reveal-item space-y-3 group">
            <span className="font-mono text-[0.7rem] text-brivo-slate uppercase tracking-wider block">
              04 / DEDUPLICATION
            </span>
            <h3 className="text-base font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors">
              Multi-Factor Graph
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Multi-factor clustering algorithm identifies near-duplicate orders, cross-references connected noticees, and tracks repeat offenders.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CORE ARCHITECTURE */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 border-t border-brivo-navy/10 scroll-reveal-section">
        <div className="space-y-3">
          <MicroLabel number="N°03" label="CORE ARCHITECTURE" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-brivo-navy font-sans tracking-[-0.025em] leading-[1.12]">
            Engineered for{" "}
            <span className="font-serif italic font-normal editorial-interactive-italic">
              audit-grade veracity.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 hover:border-brivo-navy/30 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between h-full">
            <span className="font-mono text-[0.68rem] text-brivo-slate uppercase tracking-widest block">
              N°01 // AUDIT
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-brivo-navy tracking-tight">
              Traceable Provenance
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Verifiable SHA-256 hashes and timestamped raw snapshots ensure every record can withstand institutional audit.
            </p>
          </TiltCard>

          <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 hover:border-brivo-navy/30 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between h-full">
            <span className="font-mono text-[0.68rem] text-brivo-slate uppercase tracking-widest block">
              N°02 // PLUGGABLE
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-brivo-navy tracking-tight">
              Source Adapter ETL
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Clean abstract contracts make registering new registries (MahaRERA, NCLT, CCI) a straightforward 10-line integration.
            </p>
          </TiltCard>

          <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 hover:border-brivo-navy/30 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between h-full">
            <span className="font-mono text-[0.68rem] text-brivo-slate uppercase tracking-widest block">
              N°03 // CLUSTERING
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-brivo-navy tracking-tight">
              Near-Duplicate Detection
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Fuzzy title similarity, penalty parity, and shared noticees connect related proceedings automatically.
            </p>
          </TiltCard>

          <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 hover:border-brivo-navy/30 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between h-full">
            <span className="font-mono text-[0.68rem] text-brivo-slate uppercase tracking-widest block">
              N°04 // COMPLIANT
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-brivo-navy tracking-tight">
              Polite Ingestion Crawler
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
              Token-bucket rate limiting (1.0 req/sec) and automated robots.txt respect registry server capacity.
            </p>
          </TiltCard>
        </div>
      </section>

      {/* 5. INTERACTIVE CASE DOSSIERS */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 border-t border-brivo-navy/10 scroll-reveal-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <MicroLabel number="N°04" label="INTERACTIVE CASE DOSSIERS" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-brivo-navy font-sans tracking-[-0.025em] leading-[1.12]">
              Precision dossiers for{" "}
              <span className="font-serif italic font-normal editorial-interactive-italic">
                high-stakes counsel.
              </span>
            </h2>
          </div>
          <Link
            href="/explorer"
            className="text-xs font-mono text-brivo-navy hover:text-brivo-cyan flex items-center gap-1.5 transition-colors group font-semibold shrink-0"
          >
            <span>EXPLORE ALL {stats.totalRecords} ORDERS</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Big numbered case showcase */}
        <div className="space-y-6">
          {recentRecords.slice(0, 3).map((record, index) => (
            <div
              key={record.id}
              className="scroll-reveal-item p-7 sm:p-8 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Big Number */}
              <div className="lg:col-span-3 space-y-2">
                <span className="font-mono text-[0.68rem] text-brivo-slate uppercase tracking-widest block">
                  CASE STUDY // {record.state || "MAHARASHTRA"}
                </span>
                <span className="font-light text-5xl sm:text-6xl lg:text-7xl font-sans text-brivo-navy/80 block">
                  {`0${index + 1}`}
                </span>
                <span className="font-mono text-[0.72rem] text-brivo-cyan font-semibold block">
                  {record.external_id}
                </span>
              </div>

              {/* Center Content */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-brivo-slate">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(record.published_date)}</span>
                  <span>•</span>
                  <span>{record.jurisdiction || "Head Office, Mumbai"}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-brivo-navy leading-snug">
                  {record.title}
                </h3>
                <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
                  {record.summary || "Adjudication order issued under SEBI enforcement provisions."}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[0.68rem] font-mono text-brivo-slate">Noticees:</span>
                  {record.entity_names?.slice(0, 3).map((ent: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-brivo-paper border border-brivo-navy/10 text-[0.68rem] font-mono text-brivo-navy"
                    >
                      {truncateText(ent, 24)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Sanction & CTA */}
              <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4 pt-4 lg:pt-0 lg:border-l lg:border-brivo-navy/10 lg:pl-8">
                <div>
                  <span className="text-[0.68rem] font-mono text-brivo-slate uppercase block">
                    Penalties Imposed
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-brivo-navy block mt-1">
                    {record.amount ? formatINR(record.amount) : "Non-Monetary"}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/explorer/${record.id}`}
                    className="px-4 py-2 rounded-full bg-brivo-paper hover:bg-brivo-mist/60 border border-brivo-navy/15 text-brivo-navy text-xs font-mono flex items-center justify-between transition-colors group shadow-xs"
                  >
                    <span>Inspect Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brivo-slate group-hover:text-brivo-navy transition-colors" />
                  </Link>

                  <button
                    onClick={() => openAiWithQuery(record.title)}
                    className="w-full px-4 py-2 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/10 text-brivo-slate hover:text-brivo-navy text-[0.7rem] font-mono flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-brivo-cyan" />
                    <span>Synthesize Risk Pattern</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. LIVE ENFORCEMENT DISPATCH TABLE */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 border-t border-brivo-navy/10 scroll-reveal-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <MicroLabel number="N°05" label="LIVE ENFORCEMENT DISPATCH" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-brivo-navy font-sans tracking-[-0.025em] leading-[1.12]">
              Live regulatory telemetry,{" "}
              <span className="font-serif italic font-normal editorial-interactive-italic">
                zero informational lag.
              </span>
            </h2>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-mono text-brivo-slate hover:text-brivo-navy flex items-center gap-1.5 font-semibold shrink-0"
          >
            <span>VIEW SYNC RUNS ({stats.totalRecords} RECORDS)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Directory Table Layout */}
        <div className="dispatch-table-container border border-brivo-navy/10 rounded-2xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.68rem] tracking-wider border-b border-brivo-navy/10">
              <tr>
                <th className="px-5 py-4">Citation</th>
                <th className="px-5 py-4">Published Date</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Jurisdiction</th>
                <th className="px-5 py-4 text-right">Penalty</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brivo-navy/5 font-sans">
              {recentRecords.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    setQuickLookRecord(r);
                    setIsQuickLookOpen(true);
                  }}
                  className="dispatch-table-row cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-[0_8px_24px_rgba(26,35,51,0.08)] hover:-translate-y-0.5 group"
                >
                  <td className="px-5 py-4 font-mono text-brivo-navy font-medium">
                    {r.external_id}
                  </td>
                  <td className="px-5 py-4 font-mono text-brivo-slate whitespace-nowrap">
                    {formatDate(r.published_date)}
                  </td>
                  <td className="px-5 py-4 text-brivo-navy max-w-md">
                    <span className="group-hover:text-brivo-cyan transition-colors font-medium text-xs sm:text-[0.82rem] line-clamp-1">
                      {r.title}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-brivo-slate whitespace-nowrap">
                    {r.state || "Maharashtra"}
                  </td>
                  <td className="px-5 py-4 font-mono text-right text-brivo-navy font-semibold whitespace-nowrap">
                    {r.amount ? formatINR(r.amount) : "Non-Monetary"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickLookRecord(r);
                          setIsQuickLookOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-brivo-paper hover:bg-brivo-mist text-[0.68rem] font-mono text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10 transition-colors"
                        title="Quick Look preview (or press Space)"
                      >
                        ⎵ Peek
                      </button>
                      <Link
                        href={`/explorer/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-brivo-slate hover:text-brivo-navy font-mono text-[0.72rem] hover:underline"
                      >
                        Audit →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. DEVELOPER & API PLATFORM WORKSHOP */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-reveal-section">
        <div className="p-8 sm:p-12 rounded-2xl bg-brivo-paper border border-brivo-navy/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-xs">
          <div className="space-y-3 max-w-xl">
            <MicroLabel number="N°06" label="DEVELOPER & API PLATFORM" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-brivo-navy font-sans tracking-tight leading-snug">
              The workshop,{" "}
              <span className="font-serif italic font-normal editorial-interactive-italic">
                out back.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-brivo-slate leading-relaxed">
              Every search query, aggregate calculation, and AI risk synthesis is exposed via an async, self-documenting FastAPI REST architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={() => openAiWithQuery("")}
              className="px-5 py-3 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono flex items-center gap-2 shadow-xs transition-all hover:border-brivo-cyan/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-brivo-cyan" />
              <span>Live AI Briefing</span>
            </MagneticButton>

            <a
              href="http://127.0.0.1:8005/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-mono flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <span>Swagger / OpenAPI UI</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-brivo-cyan" />
            </a>
          </div>
        </div>
      </section>

      {/* 8. NAVIGATION INDEX */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12 border-t border-brivo-navy/10 scroll-reveal-section">
        <div className="space-y-3">
          <MicroLabel number="N°07" label="NAVIGATION INDEX" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-brivo-navy font-sans tracking-[-0.025em] leading-[1.12]">
            Where would you like to{" "}
            <span className="font-serif italic font-normal editorial-interactive-italic">
              start?
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/explorer" className="h-full">
            <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all duration-300 space-y-3 group shadow-xs hover:shadow-md flex flex-col justify-between h-full">
              <span className="font-mono text-[0.68rem] text-brivo-slate uppercase">01 / ARCHIVE</span>
              <h3 className="text-base sm:text-lg font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors flex items-center justify-between">
                <span>Record Explorer</span>
                <ArrowRight className="w-4 h-4 text-brivo-slate group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
                Full-text vector search and multi-facet filtering over SEBI adjudication orders.
              </p>
            </TiltCard>
          </Link>

          <Link href="/analytics" className="h-full">
            <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all duration-300 space-y-3 group shadow-xs hover:shadow-md flex flex-col justify-between h-full">
              <span className="font-mono text-[0.68rem] text-brivo-slate uppercase">02 / TRENDS</span>
              <h3 className="text-base sm:text-lg font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors flex items-center justify-between">
                <span>Market Analytics</span>
                <ArrowRight className="w-4 h-4 text-brivo-slate group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
                Period-over-period velocity changes, penalty distributions, and duplicate detector.
              </p>
            </TiltCard>
          </Link>

          <Link href="/jobs" className="h-full">
            <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all duration-300 space-y-3 group shadow-xs hover:shadow-md flex flex-col justify-between h-full">
              <span className="font-mono text-[0.68rem] text-brivo-slate uppercase">03 / PIPELINE</span>
              <h3 className="text-base sm:text-lg font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors flex items-center justify-between">
                <span>Crawler Jobs</span>
                <ArrowRight className="w-4 h-4 text-brivo-slate group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
                Execution audit logs, sync rate limits, and live scheduler trigger controls.
              </p>
            </TiltCard>
          </Link>

          <Link href="/api-explorer" className="h-full">
            <TiltCard className="scroll-reveal-item p-6 sm:p-7 rounded-2xl bg-white border border-brivo-navy/10 hover:border-brivo-navy/30 transition-all duration-300 space-y-3 group shadow-xs hover:shadow-md flex flex-col justify-between h-full">
              <span className="font-mono text-[0.68rem] text-brivo-slate uppercase">04 / TERMINAL</span>
              <h3 className="text-base sm:text-lg font-semibold text-brivo-navy group-hover:text-brivo-cyan transition-colors flex items-center justify-between">
                <span>API Sandbox</span>
                <ArrowRight className="w-4 h-4 text-brivo-slate group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-brivo-slate leading-relaxed">
                Interactive cURL builder, response inspector, and live JSON payload visualizer.
              </p>
            </TiltCard>
          </Link>
        </div>
      </section>

      {/* Floating Intelligence Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialQuery={aiInitialQuery}
      />

      {/* macOS-style Spacebar Quick Look Modal */}
      <QuickLookModal
        record={quickLookRecord}
        isOpen={isQuickLookOpen}
        onClose={() => setIsQuickLookOpen(false)}
      />
    </div>
  );
}
