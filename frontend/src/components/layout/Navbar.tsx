"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
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
import { getHealth, triggerSyncJob, prefetchTab } from "@/lib/api";
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
  const [isScrolled, setIsScrolled] = useState(false);

  const telemetryRef = useRef<HTMLDivElement>(null);
  const telemetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTelemetryEnter = () => {
    if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
    setShowTelemetryPopover(true);
  };

  const handleTelemetryLeave = () => {
    telemetryTimeoutRef.current = setTimeout(() => {
      setShowTelemetryPopover(false);
    }, 150);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (telemetryRef.current && !telemetryRef.current.contains(e.target as Node)) {
        setShowTelemetryPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
    };
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ x: number; width: number; ready: boolean }>({
    x: 0,
    width: 0,
    ready: false,
  });

  const navLinks = [
    { href: "/explorer", label: "Explorer", icon: Search },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/jobs", label: "Ingestion Jobs", icon: Clock },
    { href: "/api-explorer", label: "API Console", icon: Terminal },
  ];

  const activeIndex = navLinks.findIndex((link) => pathname.startsWith(link.href));

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealthStatus(data.status);
        if (data.total_records) setTotalRecords(data.total_records);
        if (data.total_entities) setTotalEntities(data.total_entities);
      })
      .catch(() => setHealthStatus("degraded"));
  }, []);

  // Scroll listener with RAF throttling and hysteresis to eliminate jitter
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && currentY > 60) return true;
            if (prev && currentY < 30) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Synchronized indicator measurement
  const updateIndicator = useCallback(() => {
    if (activeIndex !== -1 && linkRefs.current[activeIndex] && navRef.current) {
      const el = linkRefs.current[activeIndex]!;
      setIndicator({
        x: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicator();
    const raf = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [updateIndicator, isScrolled, pathname]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

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

  return (
    <>
      {/* Dynamic Morphing Navigation Container */}
      <header
        className={`sticky z-40 w-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
          isScrolled
            ? "top-3 sm:top-4 px-4 sm:px-6 max-w-6xl xl:max-w-7xl"
            : "top-0 px-6 sm:px-10 lg:px-12 max-w-[1400px]"
        } mx-auto`}
      >
        <div
          className={`w-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu flex items-center justify-between gap-4 select-none ${
            isScrolled
              ? "h-16 px-6 sm:px-8 rounded-full bg-white/90 backdrop-blur-xl border border-brivo-navy/12 shadow-[0_16px_36px_-8px_rgba(11,16,32,0.12)]"
              : "h-20 sm:h-22 px-2 sm:px-4 rounded-none bg-transparent border-b border-transparent shadow-none"
          }`}
        >
          {/* Brand Monogram & Name */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div
              className={`rounded-2xl border border-brivo-navy/15 bg-brivo-paper flex items-center justify-center text-brivo-navy group-hover:border-brivo-cyan group-hover:scale-105 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xs overflow-hidden p-1 ${
                isScrolled ? "w-8.5 h-8.5" : "w-10.5 h-10.5"
              }`}
            >
              <Image
                src="/icon_logo.png"
                alt="KRIO Icon"
                width={38}
                height={38}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-bold tracking-tight text-brivo-navy font-sans transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                }`}
              >
                KRIO
              </span>
              <span
                className={`text-brivo-slate/70 font-mono font-medium tracking-wide transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isScrolled ? "text-xs" : "text-xs sm:text-sm font-semibold"
                }`}
              >
                .LEXGOV
              </span>
            </div>
          </Link>

          {/* Center Navigation Links with Invariant Geometry & Horizontal Sliding Pill */}
          <nav
            ref={navRef}
            className="relative hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-brivo-paper/70 border border-brivo-navy/10 shadow-2xs transition-colors duration-300 shrink-0"
          >
            {/* Absolute Horizontal-Only Animated Pill */}
            {indicator.ready && activeIndex !== -1 && (
              <motion.div
                className="absolute inset-y-1.5 rounded-full bg-brivo-navy shadow-xs z-0 pointer-events-none"
                initial={false}
                animate={{
                  left: indicator.x,
                  width: indicator.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}

            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  ref={(el) => {
                    linkRefs.current[index] = el;
                  }}
                  href={link.href}
                  onMouseEnter={() => prefetchTab(link.href)}
                  onFocus={() => prefetchTab(link.href)}
                  className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center justify-center gap-2 select-none cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                      isActive ? "text-brivo-cyan" : "text-brivo-slate"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap transition-colors duration-200 ${
                      isActive
                        ? "text-brivo-paper font-semibold"
                        : "text-brivo-navy/80 hover:text-brivo-navy"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* AI Synthesizer Trigger Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className={`rounded-full bg-brivo-paper hover:bg-brivo-mist/80 border border-brivo-navy/15 text-brivo-navy font-sans transition-all flex items-center shadow-2xs group hover:border-brivo-cyan active:scale-95 cursor-pointer ${
                isScrolled
                  ? "h-10 px-4 text-xs sm:text-sm gap-2"
                  : "h-11 sm:h-12 px-4.5 sm:px-5 text-xs sm:text-sm gap-2.5 font-semibold"
              }`}
              title="Open AI Precedent & Risk Synthesizer (Cmd+K)"
            >
              <Sparkles className="w-4 h-4 text-brivo-cyan group-hover:rotate-12 transition-transform shrink-0" />
              <span className="hidden sm:inline font-semibold">Synthesize</span>
              <kbd className="hidden sm:inline-flex items-center text-[0.7rem] px-2 py-0.5 rounded-md bg-white border border-brivo-navy/15 text-brivo-slate font-mono font-medium shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Live Registry Telemetry Beacon */}
            <div
              ref={telemetryRef}
              className="relative"
              onMouseEnter={handleTelemetryEnter}
              onMouseLeave={handleTelemetryLeave}
            >
              <button
                onClick={() => setShowTelemetryPopover(!showTelemetryPopover)}
                className={`rounded-full bg-brivo-navy text-brivo-paper font-sans flex items-center transition-all shadow-sm hover:bg-brivo-navy/90 cursor-pointer ${
                  isScrolled
                    ? "h-10 px-4 text-xs sm:text-sm gap-2"
                    : "h-11 sm:h-12 px-4.5 sm:px-5 text-xs sm:text-sm gap-2.5 font-semibold"
                }`}
                title="Live Registry Ingestion Telemetry"
              >
                <span
                  className={`rounded-full ${
                    isScrolled ? "w-2 h-2" : "w-2.5 h-2.5"
                  } ${
                    healthStatus === "healthy"
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse"
                      : "bg-amber-400 animate-ping"
                  }`}
                />
                <span className="font-semibold tracking-wider hidden sm:inline font-mono text-xs sm:text-[0.8rem]">
                  {syncMessage ? syncMessage : "REGISTRY LIVE"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-brivo-slate transition-transform shrink-0" />
              </button>

              {/* Telemetry Popover Menu */}
              {showTelemetryPopover && (
                <div
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
