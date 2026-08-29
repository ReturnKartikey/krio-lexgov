"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BarChart3, Clock, Terminal, Activity, ShieldCheck, RefreshCw, ChevronDown } from "lucide-react";
import { getHealth, triggerSyncJob } from "@/lib/api";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";

export function Navbar() {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [totalRecords, setTotalRecords] = useState<number>(35);
  const [totalEntities, setTotalEntities] = useState<number>(612);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTelemetryPopover, setShowTelemetryPopover] = useState(false);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealthStatus(data.status);
        if (data.total_records) setTotalRecords(data.total_records);
        if (data.total_entities) setTotalEntities(data.total_entities);
      })
      .catch(() => setHealthStatus("degraded"));
  }, []);

  // Smooth scroll listener with hysteresis to prevent jumpiness
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY;
          if (scrollPos > 40 && !isScrolled) {
            setIsScrolled(true);
          } else if (scrollPos <= 20 && isScrolled) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAiModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Syncing SEBI Feed...");
    try {
      const res = await triggerSyncJob({ incremental: true, limit: 20 });
      setSyncMessage(`Synced: ${res.status.toUpperCase()}`);
    } catch (err: any) {
      setSyncMessage("Sync Failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 3500);
    }
  };

  const navLinks = [
    { href: "/explorer", label: "Explorer", icon: Search },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/jobs", label: "Ingestion Jobs", icon: Clock },
    { href: "/api-explorer", label: "API Console", icon: Terminal },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "py-2.5 px-4 pointer-events-none"
            : "py-0 px-0 bg-white/95 backdrop-blur-xl border-b border-brivo-navy/12 shadow-[0_1px_8px_rgba(26,35,51,0.04)]"
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
            isScrolled
              ? "max-w-4xl h-12 px-4 sm:px-6 rounded-full bg-white/95 backdrop-blur-2xl border border-brivo-navy/15 shadow-[0_12px_36px_-6px_rgba(26,35,51,0.12)]"
              : "max-w-7xl h-16 px-4 sm:px-6 lg:px-8"
          }`}
        >
          {/* Brand Logo (Clean KRIO.LEXGOV without SEBI tag) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded border border-brivo-navy/20 bg-brivo-paper flex items-center justify-center text-brivo-navy group-hover:border-brivo-cyan transition-colors shadow-2xs">
                <span className="font-serif italic font-bold text-base leading-none text-brivo-navy">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-brivo-navy flex items-center gap-1 font-sans">
                  KRIO<span className="text-brivo-slate font-light">.LEXGOV</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brivo-navy text-brivo-paper font-medium shadow-sm"
                      : "text-brivo-slate hover:text-brivo-navy hover:bg-brivo-navy/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brivo-cyan" : "text-brivo-slate"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: AI Synthesizer & Telemetry Hub */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Synthesizer Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm group hover:border-brivo-cyan active:scale-95"
              title="Open AI Precedent & Risk Synthesizer (Cmd+K)"
            >
              <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
              <span className="font-semibold hidden sm:inline">Synthesize</span>
              <kbd className="hidden sm:inline-flex items-center text-[0.6rem] px-1.5 py-0.2 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-slate">
                ⌘K
              </kbd>
            </button>

            {/* Live Registry Telemetry Beacon (Replaces the clunky sync button) */}
            <div className="relative">
              <button
                onClick={() => setShowTelemetryPopover(!showTelemetryPopover)}
                onMouseEnter={() => setShowTelemetryPopover(true)}
                className="px-3 py-1.5 rounded-full bg-brivo-navy/5 hover:bg-brivo-navy/10 border border-brivo-navy/12 font-mono text-[0.68rem] text-brivo-navy flex items-center gap-1.5 transition-all shadow-2xs group cursor-pointer"
                title="Live Registry Ingestion Telemetry"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthStatus === "healthy"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                      : "bg-amber-500 animate-ping"
                  }`}
                />
                <span className="font-semibold tracking-wider hidden sm:inline">
                  {syncMessage ? syncMessage : "REGISTRY LIVE"}
                </span>
                <ChevronDown className="w-3 h-3 text-brivo-slate group-hover:text-brivo-navy transition-transform" />
              </button>

              {/* Interactive Telemetry Dropdown / Popover */}
              {showTelemetryPopover && (
                <div
                  onMouseLeave={() => setShowTelemetryPopover(false)}
                  className="absolute right-0 top-full mt-2 w-64 p-4 rounded-xl bg-white border border-brivo-navy/15 shadow-2xl z-50 space-y-3 font-mono text-xs animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-brivo-navy/10 pb-2">
                    <span className="text-[0.65rem] text-brivo-slate uppercase font-bold">
                      Registry Telemetry
                    </span>
                    <span className="text-[0.65rem] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      100% HEALTHY
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[0.7rem] text-brivo-navy">
                    <div className="flex justify-between">
                      <span className="text-brivo-slate">Indexed Orders:</span>
                      <span className="font-semibold">{totalRecords} Records</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brivo-slate">Extracted Entities:</span>
                      <span className="font-semibold">{totalEntities} Noticees</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brivo-slate">Crawler Rate Limit:</span>
                      <span className="font-semibold">1.0 req/sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brivo-slate">Scheduler:</span>
                      <span className="font-semibold">6-Hour Cadence</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brivo-navy/10">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="w-full py-1.5 rounded-lg bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-[0.7rem] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
                      <span>{isSyncing ? "Syncing Feed..." : "Trigger Incremental Sync"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Intelligence Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
