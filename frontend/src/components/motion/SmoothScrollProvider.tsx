"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Native 1:1 Instant Response Scroll Provider (Bloomberg Forensic Engine)
 *
 * Relies on the browser's hardware 1:1 scroll engine with zero virtual scroll interception.
 * - Zero input latency on mouse wheel clicks and steps.
 * - Windows Precision and macOS Trackpads use their native physical momentum.
 * - Tables, dockets, and filters feel hyper-snappy, forensic, and clinical.
 * - GSAP ScrollTrigger and layout observers sync directly with hardware compositor frames.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Register GSAP ScrollTrigger with the browser's native 1:1 hardware scroll engine
    gsap.registerPlugin(ScrollTrigger);

    // Initial trigger geometry synchronization
    ScrollTrigger.refresh();
  }, []);

  // Guarantee clean, instant 1:1 top landing and trigger refresh on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);

  return <>{children}</>;
}

