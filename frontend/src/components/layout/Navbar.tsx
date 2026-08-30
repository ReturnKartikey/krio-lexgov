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

  const activeIndex = navLinks.findIndex(
    (link) => pathname.startsWith(link.href) || (link.href === "/explorer" && pathname === "/")
  );

  // Scroll listener with RAF throttling and balanced threshold for seamless forward and reverse morphing
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
          {/* Brand Monogram & Name - Invariant Coordinate System */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div
              className="w-9.5 h-9.5 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0"
            >
              <Image
                src="/icon_logo.png"
                alt="KRIO Icon"
                width={38}
                height={38}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="font-bold tracking-tight text-brivo-navy font-sans text-lg">
                KRIO
              </span>
              <span className="text-brivo-slate/70 font-mono font-medium tracking-wide text-xs">
                .LEXGOV
              </span>
            </div>
          </Link>

          {/* Center Navigation Links with Invariant Geometry & Horizontal Sliding Pill */}
          <nav
            ref={navRef}
            className="relative hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-brivo-paper/80 border border-brivo-navy/10 shadow-2xs transition-colors duration-300 shrink-0"
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
              const isActive =
                pathname.startsWith(link.href) || (link.href === "/explorer" && pathname === "/");
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

          {/* Right Action Group - Synthesizer Action Pill */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="h-10 px-4 rounded-full bg-brivo-paper/90 hover:bg-white border border-brivo-navy/10 hover:border-brivo-cyan/50 text-brivo-navy font-sans text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shadow-2xs group active:scale-95 cursor-pointer select-none"
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

      {/* Global Intelligence Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
