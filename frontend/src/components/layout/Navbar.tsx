"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BarChart3, Clock, Terminal, RefreshCw, Sparkles, Command } from "lucide-react";
import { getHealth, triggerSyncJob } from "@/lib/api";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";

export function Navbar() {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    getHealth()
      .then((data) => setHealthStatus(data.status))
      .catch(() => setHealthStatus("degraded"));
  }, []);

  // Global shortcut
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

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await triggerSyncJob({ incremental: true, limit: 20 });
      setSyncMessage(`Sync ${res.status}: Run ${res.run_id.slice(0, 8)}`);
    } catch (err: any) {
      setSyncMessage("Sync failed");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
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
      <header className="sticky top-0 z-40 w-full bg-brivo-paper/90 backdrop-blur-md border-b border-brivo-navy/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded border border-brivo-navy/20 bg-brivo-paper flex items-center justify-center text-brivo-navy group-hover:border-brivo-cyan transition-colors">
                <span className="font-serif italic font-bold text-base leading-none text-brivo-navy">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-brivo-navy flex items-center gap-1.5 font-sans">
                  KRIO<span className="text-brivo-slate font-light">.LEXGOV</span>
                  <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-brivo-mist border border-brivo-cyan/30 text-brivo-navy font-mono">
                    SEBI
                  </span>
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
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Synthesizer Trigger Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm group hover:border-brivo-cyan/50"
              title="Open AI Statutory Risk Synthesizer (Cmd+K)"
            >
              <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
              <span className="font-semibold hidden sm:inline">Synthesize</span>
              <kbd className="hidden sm:inline-flex items-center text-[0.6rem] px-1.5 py-0.2 rounded bg-brivo-paper border border-brivo-navy/10 text-brivo-slate">
                ⌘K
              </kbd>
            </button>

            {/* Health indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brivo-navy/5 border border-brivo-navy/10 font-mono text-[0.65rem] text-brivo-slate">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthStatus === "healthy"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : healthStatus === "checking"
                    ? "bg-brivo-cyan animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="tracking-wider">{healthStatus === "healthy" ? "REGISTRY LIVE" : healthStatus.toUpperCase()}</span>
            </div>

            {/* Sync status message */}
            {syncMessage && (
              <span className="text-[0.65rem] font-mono text-brivo-navy animate-fade-in hidden xl:inline">
                {syncMessage}
              </span>
            )}

            {/* Trigger Sync Button */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-full bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper text-xs font-medium tracking-wide transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-brivo-cyan" : "text-brivo-cyan"}`} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Live"}</span>
            </button>
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
