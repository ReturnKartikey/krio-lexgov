"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BarChart3,
  Clock,
  Sparkles,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { prefetchTab } from "@/lib/api";
import Image from "next/image";
import { IntelligenceModal } from "@/components/ai/IntelligenceModal";

export function Navbar() {
  const pathname = usePathname();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > 40;
    }
    return false;
  });
  const [isMounted, setIsMounted] = useState(false);

  const navLinks = [
    { href: "/explorer", label: "Explorer", icon: Search },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/jobs", label: "Ingestion Jobs", icon: Clock },
  ];

  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const currentPath = optimisticPath ?? pathname;
  const activeIndex = navLinks.findIndex((link) => currentPath.startsWith(link.href));

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pillRect, setPillRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const updatePill = useCallback(() => {
    if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
      const el = tabRefs.current[activeIndex];
      if (el) {
        setPillRect({
          x: el.offsetLeft,
          y: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      }
    } else {
      setPillRect(null);
    }
  }, [activeIndex]);

  // Synchronize pill geometry whenever active index or scroll/morph state changes
  useEffect(() => {
    updatePill();
  }, [updatePill, isScrolled]);

  // Reset optimistic path when real pathname catches up
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  // Handle window resize and font load to keep pill sub-pixel accurate
  useEffect(() => {
    const handleResize = () => updatePill();
    window.addEventListener("resize", handleResize);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(updatePill);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, [updatePill]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Scroll listener with RAF throttling and mount detection
  useEffect(() => {
    setIsMounted(true);
    updatePill();
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
  }, [updatePill]);

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
      <motion.header
        initial={false}
        className="sticky top-0 z-40 w-full pointer-events-none flex justify-center"
        animate={{
          paddingTop: isScrolled ? 14 : 0,
        }}
        transition={
          isMounted
            ? { type: "spring", stiffness: 220, damping: 26, mass: 0.75 }
            : { duration: 0 }
        }
        style={{
          transform: "translateZ(0)",
          willChange: "padding-top",
        }}
      >
        <motion.div
          initial={false}
          className="relative pointer-events-auto flex items-center justify-between gap-5 sm:gap-6 select-none overflow-hidden"
          animate={{
            width: "100%",
            maxWidth: isScrolled ? "548px" : "1360px",
            height: isScrolled ? "54px" : "80px",
            borderRadius: isScrolled ? "9999px" : "0px",
            paddingLeft: isScrolled ? "18px" : "34px",
            paddingRight: isScrolled ? "18px" : "34px",
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0)",
            borderColor: isScrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0)",
            boxShadow: isScrolled
              ? "0 18px 46px rgba(9, 13, 22, 0.10), inset 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 0 rgba(9, 13, 22, 0.04)"
              : "0 0 0 rgba(0, 0, 0, 0)",
          }}
          transition={
            isMounted
              ? { type: "spring", stiffness: 220, damping: 26, mass: 0.75 }
              : { duration: 0 }
          }
          style={{
            backdropFilter: isScrolled ? "blur(24px) saturate(180%)" : "blur(0px) saturate(100%)",
            WebkitBackdropFilter: isScrolled ? "blur(24px) saturate(180%)" : "blur(0px) saturate(100%)",
            borderWidth: 1,
            borderStyle: "solid",
            transform: "translateZ(0)",
            willChange: "max-width, height, transform",
            transition: isMounted
              ? "backdrop-filter 0.35s cubic-bezier(0.16, 1, 0.3, 1), -webkit-backdrop-filter 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
        >
          {/* iOS Specular Glass Bevel Reflection */}
          <motion.div
            initial={false}
            animate={{ opacity: isScrolled ? 0.9 : 0 }}
            transition={isMounted ? { duration: 0.25, ease: "easeOut" } : { duration: 0 }}
            className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none rounded-full"
          />

          {/* Left Wing - Brand Monogram & Name */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
              <div
                className={`rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 overflow-hidden shrink-0 shadow-2xs border border-white/80 ${
                  isScrolled
                    ? "w-7.5 h-7.5 max-w-[30px] max-h-[30px]"
                    : "w-9 h-9 sm:w-9.5 sm:h-9.5 max-w-[38px] max-h-[38px]"
                }`}
              >
                <Image
                  src="/icon_logo.png"
                  alt="KRIO Icon"
                  width={38}
                  height={38}
                  style={{ width: "100%", height: "100%" }}
                  className="w-full h-full object-contain rounded-xl shrink-0"
                  priority
                />
              </div>
              <div className="flex items-baseline shrink-0">
                <span
                  className={`font-bold tracking-tight text-brivo-navy font-sans ${
                    isScrolled ? "text-sm sm:text-base" : "text-base sm:text-lg lg:text-xl"
                  }`}
                >
                  KRIO
                </span>
                <span
                  className={`text-brivo-slate/75 font-mono font-medium tracking-tight ml-1 ${
                    isScrolled ? "text-[0.625rem]" : "text-[0.7rem] sm:text-xs"
                  }`}
                >
                  .LEXGOV
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation - iOS Segmented Glass Track */}
          <div className="shrink-0 hidden md:flex items-center justify-center">
            <motion.nav
              ref={navRef}
              className={`relative flex items-center rounded-full bg-black/[0.04] backdrop-blur-md border border-white/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] select-none ${
                isScrolled ? "p-1" : "p-1 sm:p-1.5"
              }`}
            >
              {/* Single Local Sliding Active Pill */}
              {isMounted && pillRect && activeIndex >= 0 && (
                <motion.div
                  className="absolute top-0 left-0 rounded-full bg-brivo-navy shadow-[0_2px_8px_rgba(9,13,22,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none z-0"
                  style={{ top: 0, left: 0 }}
                  initial={false}
                  animate={{
                    x: pillRect.x,
                    y: pillRect.y,
                    width: pillRect.width,
                    height: pillRect.height,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 38,
                  }}
                />
              )}

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
                    onClick={() => setOptimisticPath(link.href)}
                    onMouseEnter={() => prefetchTab(link.href)}
                    onFocus={() => prefetchTab(link.href)}
                    className={`relative rounded-full font-medium font-sans flex items-center justify-center select-none cursor-pointer whitespace-nowrap transition-colors duration-150 outline-none ${
                      isScrolled
                        ? "px-3 py-1.5 text-xs gap-1.5"
                        : "px-4 py-2 text-xs sm:text-[0.8125rem] gap-2"
                    } ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-brivo-slate hover:text-brivo-navy hover:bg-black/[0.03]"
                    }`}
                  >
                    {/* Fallback static pill for SSR / initial paint before mount */}
                    {!isMounted && isActive && (
                      <div className="absolute inset-0 rounded-full bg-brivo-navy shadow-[0_2px_8px_rgba(9,13,22,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] z-0 pointer-events-none" />
                    )}
                    <span className={`relative z-10 flex items-center ${isScrolled ? "gap-1.5" : "gap-2"}`}>
                      <Icon
                        className={`shrink-0 transition-colors duration-150 ${
                          isScrolled ? "w-3.5 h-3.5" : "w-4 h-4"
                        } ${
                          isActive ? "text-brivo-cyan" : "text-brivo-slate/80"
                        }`}
                      />
                      <span>{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </motion.nav>
          </div>

          {/* Mobile Hamburger Toggle (Always visible on mobile) */}
          <div className="md:hidden flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/70 hover:bg-white backdrop-blur-md border border-white/80 flex items-center justify-center text-brivo-navy transition-all active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,1)]"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-brivo-navy" />
              ) : (
                <Menu className="w-4 h-4 text-brivo-navy" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Mobile Slide-Down Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto md:hidden mt-2 mx-3 sm:mx-4 p-3 rounded-3xl bg-white/75 backdrop-blur-2xl backdrop-saturate-[180%] border border-white/80 shadow-[0_24px_50px_rgba(9,13,22,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] space-y-1.5"
            >
              <div className="text-[0.65rem] font-mono text-brivo-slate uppercase px-3 py-1 tracking-wider border-b border-black/[0.06] pb-1.5">
                Navigation Modules
              </div>
              <div className="grid grid-cols-1 gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-3.5 py-2.5 rounded-2xl font-sans text-sm font-medium flex items-center justify-between transition-all ${
                        isActive
                          ? "bg-brivo-navy text-white shadow-xs"
                          : "text-brivo-navy hover:bg-black/[0.03] text-brivo-navy/90"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-brivo-cyan" : "text-brivo-slate"
                          }`}
                        />
                        <span>{link.label}</span>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-brivo-cyan" : "text-brivo-slate/60"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Quick Action */}
              <div className="pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAiModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-white/90 text-brivo-navy font-sans text-sm font-semibold flex items-center justify-between transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,1)]"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brivo-cyan" />
                    <span>AI Precedent & Risk Synthesizer</span>
                  </div>
                  <span className="text-[0.65rem] font-mono font-medium px-2 py-0.5 rounded-md bg-white text-brivo-navy border border-black/[0.08] shadow-2xs">
                    ⌘K
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Global Command Menu & Intelligence Modal */}
      <IntelligenceModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
