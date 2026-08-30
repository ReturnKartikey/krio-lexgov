"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  BarChart3,
  Clock,
  Terminal,
  Sparkles,
} from "lucide-react";
import { prefetchTab } from "@/lib/api";
import Image from "next/image";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";

export function Navbar() {
  const pathname = usePathname();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ x: number; width: number; visible: boolean }>({
    x: 4,
    width: 100,
    visible: false,
  });

  const navLinks = [
    { href: "/explorer", label: "Explorer", icon: Search },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/jobs", label: "Ingestion Jobs", icon: Clock },
    { href: "/api-explorer", label: "API Console", icon: Terminal },
  ];

  const activeIndex = navLinks.findIndex((link) => pathname.startsWith(link.href));

  // Measure strictly local relative offset within the nav container
  const updatePillPosition = useCallback(() => {
    if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
      const el = tabRefs.current[activeIndex]!;
      setIndicator({
        x: el.offsetLeft,
        width: el.offsetWidth,
        visible: true,
      });
    } else {
      setIndicator((prev) => ({ ...prev, visible: false }));
    }
  }, [activeIndex]);

  // Update on route change and resize
  useEffect(() => {
    updatePillPosition();
    const raf = requestAnimationFrame(updatePillPosition);
    return () => cancelAnimationFrame(raf);
  }, [updatePillPosition, pathname]);

  useEffect(() => {
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [updatePillPosition]);

  // Scroll listener with RAF throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && currentY > 40) return true;
            if (prev && currentY <= 30) return false;
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

  return (
    <>
      {/* Dynamic Morphing Navigation Container */}
      <header
        className={`sticky top-0 z-40 w-full pointer-events-none transition-all duration-300 ease-out ${
          isScrolled ? "pt-3.5 px-4 sm:px-6" : "pt-0 px-4 sm:px-6 lg:px-8"
        }`}
      >
        <div
          className={`w-full mx-auto pointer-events-auto transition-all duration-300 ease-out transform-gpu flex items-center justify-between gap-4 sm:gap-6 select-none ${
            isScrolled
              ? "max-w-[1040px] xl:max-w-5xl h-16 px-6 sm:px-7 rounded-full bg-white/95 backdrop-blur-xl border border-brivo-navy/12 shadow-[0_16px_36px_-8px_rgba(11,16,32,0.12)]"
              : "max-w-7xl h-20 px-4 sm:px-6 rounded-2xl bg-white/0 backdrop-blur-none border border-transparent shadow-none"
          }`}
        >
          {/* Left Wing - Brand Monogram & Name */}
          <div className="flex-1 flex items-center justify-start shrink-0">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div
                className="w-9 h-9 max-w-[36px] max-h-[36px] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0"
              >
                <Image
                  src="/icon_logo.png"
                  alt="KRIO Icon"
                  width={36}
                  height={36}
                  style={{ width: "36px", height: "36px", maxWidth: "36px", maxHeight: "36px" }}
                  className="w-9 h-9 max-w-[36px] max-h-[36px] object-contain rounded-xl shrink-0"
                  priority
                />
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="font-bold tracking-tight text-brivo-navy font-sans text-base sm:text-lg">
                  KRIO
                </span>
                <span className="text-brivo-slate/70 font-mono font-medium tracking-wide text-xs">
                  .LEXGOV
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation - Seamless Gliding Segmented Control */}
          <div className="shrink-0 flex items-center justify-center">
            <nav
              className="relative hidden md:flex items-center gap-1 shrink-0 h-10 select-none"
            >
              {/* Strictly Local Spring-Gliding Active Pill */}
              <motion.div
                className="absolute inset-y-1 rounded-full bg-brivo-navy shadow-xs z-0 pointer-events-none"
                initial={false}
                animate={{
                  x: indicator.x,
                  width: indicator.width,
                  opacity: indicator.visible ? 1 : 0,
                }}
                transition={{
                  x: { type: "spring", stiffness: 480, damping: 38 },
                  width: { type: "spring", stiffness: 480, damping: 38 },
                  opacity: { duration: 0.15, ease: "easeOut" },
                }}
              />

              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const isActive = activeIndex === index;
                return (
                  <Link
                    key={link.href}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    href={link.href}
                    onMouseEnter={() => prefetchTab(link.href)}
                    onFocus={() => prefetchTab(link.href)}
                    className={`relative h-8 px-4 rounded-full text-xs sm:text-sm font-medium font-sans flex items-center justify-center gap-2 select-none cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-200 z-10 outline-none focus:outline-none focus-visible:outline-none ${
                      isActive
                        ? "text-brivo-paper font-semibold"
                        : "text-brivo-navy/80 hover:text-brivo-navy"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                        isActive ? "text-brivo-cyan" : "text-brivo-slate"
                      }`}
                    />
                    <span className="whitespace-nowrap">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Wing - Synthesizer Action Pill */}
          <div className="flex-1 flex items-center justify-end shrink-0">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="h-10 px-4 rounded-full bg-brivo-paper/90 hover:bg-white border border-brivo-navy/10 hover:border-brivo-cyan/50 text-brivo-navy font-sans text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shadow-2xs group active:scale-95 cursor-pointer select-none shrink-0"
              title="Open AI Precedent & Risk Synthesizer (Cmd+K)"
            >
              <Sparkles className="w-4 h-4 text-brivo-cyan group-hover:rotate-12 transition-transform shrink-0" />
              <span className="font-semibold text-brivo-navy tracking-tight">Synthesize</span>
              <kbd className="hidden sm:inline-flex items-center justify-center text-[0.65rem] px-2 py-0.5 rounded-md bg-white border border-brivo-navy/12 text-brivo-slate font-mono font-medium shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Menu & Intelligence Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
