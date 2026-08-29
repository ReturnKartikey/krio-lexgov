"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  BarChart3,
  Clock,
  Terminal,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Activity,
} from "lucide-react";
import { getHealth, triggerSyncJob } from "@/lib/api";
import Image from "next/image";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";

export function Navbar() {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [totalRecords, setTotalRecords] = useState<number>(35);
  const [totalEntities, setTotalEntities] = useState<number>(612);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
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
    setSyncMessage("Syncing...");
    try {
      const res = await triggerSyncJob({ incremental: true, limit: 20 });
      setSyncMessage(`Synced (${res.status})`);
    } catch (err: any) {
      setSyncMessage("Failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
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
      {/* Floating Island Navigation Container */}
      <header className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="w-full h-16 px-5 sm:px-6 rounded-2xl bg-white/95 backdrop-blur-2xl border border-brivo-navy/15 shadow-[0_16px_40px_-10px_rgba(11,16,32,0.12)] flex items-center justify-between gap-4 transition-all duration-300">
          
          {/* Brand Monogram & Name */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl border border-brivo-navy/15 bg-brivo-paper flex items-center justify-center text-brivo-navy group-hover:border-brivo-cyan group-hover:scale-105 transition-all shadow-xs overflow-hidden p-1">
              <Image
                src="/icon_logo.png"
                alt="KRIO Icon"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base tracking-tight text-brivo-navy font-sans">
                KRIO
              </span>
              <span className="text-brivo-slate/70 text-xs font-mono font-medium tracking-wide">
                .LEXGOV
              </span>
            </div>
          </Link>

          {/* Center Navigation Links with Smooth Liquid Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-brivo-paper/80 p-1.5 rounded-xl border border-brivo-navy/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans transition-colors flex items-center gap-1.5 z-10 select-none"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbarActiveIndicator"
                      className="absolute inset-0 rounded-lg bg-brivo-navy shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-brivo-cyan" : "text-brivo-slate"
                    }`}
                  />
                  <span
                    className={
                      isActive
                        ? "text-brivo-paper font-semibold"
                        : "text-brivo-navy/80 hover:text-brivo-navy"
                    }
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* AI Synthesizer Trigger Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-brivo-paper hover:bg-brivo-mist/80 border border-brivo-navy/15 text-brivo-navy text-xs font-mono transition-all flex items-center gap-2 shadow-2xs group hover:border-brivo-cyan active:scale-95 cursor-pointer"
              title="Open AI Precedent & Risk Synthesizer (Cmd+K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-brivo-cyan group-hover:rotate-12 transition-transform" />
              <span className="font-semibold hidden sm:inline text-xs">Synthesize</span>
              <kbd className="hidden sm:inline-flex items-center text-[0.65rem] px-1.5 py-0.5 rounded bg-white border border-brivo-navy/15 text-brivo-slate font-mono font-medium shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Live Registry Telemetry Beacon */}
            <div className="relative">
              <button
                onClick={() => setShowTelemetryPopover(!showTelemetryPopover)}
                onMouseEnter={() => setShowTelemetryPopover(true)}
                className="h-9 px-3.5 rounded-xl bg-brivo-navy text-brivo-paper font-mono text-[0.72rem] flex items-center gap-2 transition-all shadow-sm hover:bg-brivo-navy/90 cursor-pointer"
                title="Live Registry Ingestion Telemetry"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthStatus === "healthy"
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse"
                      : "bg-amber-400 animate-ping"
                  }`}
                />
                <span className="font-semibold tracking-wider hidden sm:inline">
                  {syncMessage ? syncMessage : "REGISTRY LIVE"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-brivo-slate transition-transform" />
              </button>

              {/* Telemetry Popover Menu */}
              {showTelemetryPopover && (
                <div
                  onMouseLeave={() => setShowTelemetryPopover(false)}
                  className="absolute right-0 top-full mt-2.5 w-64 p-4 rounded-2xl bg-white border border-brivo-navy/15 shadow-2xl z-50 space-y-3 font-mono text-xs animate-fade-in"
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
                      className="w-full py-2 rounded-xl bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-[0.7rem] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isSyncing ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"
                        }`}
                      />
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
