"use client";

import React, { useRef, useEffect, useState } from "react";

export function MadeBySignature() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(32);
  const [opacity, setOpacity] = useState(0.85);

  useEffect(() => {
    let ticking = false;

    const updatePosition = () => {
      if (!containerRef.current || !textRef.current) return;

      const container = containerRef.current;
      const text = textRef.current;

      const containerWidth = container.clientWidth || window.innerWidth;
      const span = text.querySelector("span") as HTMLElement | null;
      const textWidth = span ? span.offsetWidth || span.scrollWidth : (text.scrollWidth || text.offsetWidth);
      const windowHeight = window.innerHeight;

      // Document scroll metrics
      const docHeight = document.documentElement.scrollHeight;
      const maxScroll = Math.max(1, docHeight - windowHeight);
      const currentScroll = window.scrollY || window.pageYOffset || 0;

      // Calculate the active scroll range:
      // Starts when the top of the signature section enters the bottom of the viewport
      // Ends when the user scrolls to the absolute bottom of the page ("full scroll")
      const containerOffsetTop = container.offsetTop || 0;
      const sectionEnterScrollY = Math.max(0, containerOffsetTop - windowHeight);
      const pageEndScrollY = maxScroll;
      const activeDistance = pageEndScrollY - sectionEnterScrollY;

      let progress = 0;
      if (activeDistance > 10) {
        progress = (currentScroll - sectionEnterScrollY) / activeDistance;
      } else {
        progress = currentScroll / maxScroll;
      }
      const clampedProgress = Math.min(1, Math.max(0, progress));

      // Responsive padding from viewport boundary
      const padding = Math.max(24, Math.min(64, containerWidth * 0.04));

      if (textWidth > containerWidth - 2 * padding) {
        // Text is wider than viewport:
        // Progress 0: Left aligned with padding -> "MADE WITH" is 100% visible inside screen
        // Progress 1: Right aligned with padding -> "...BY KARTIKEY" completes 100% inside screen
        const startX = padding;
        const endX = containerWidth - padding - textWidth;
        const currentX = startX + (endX - startX) * clampedProgress;
        setTranslateX(currentX);
      } else {
        // Text fits comfortably inside viewport:
        // Center-aligned with smooth, dynamic parallax drift
        const centerOffset = (containerWidth - textWidth) / 2;
        const maxDrift = Math.max(30, Math.min(120, (containerWidth - textWidth - 2 * padding) / 2));
        const startX = centerOffset + maxDrift;
        const endX = centerOffset - maxDrift;
        const currentX = startX + (endX - startX) * clampedProgress;
        setTranslateX(currentX);
      }

      // Responsive opacity that shines as user enters the section
      const dynamicOpacity = 0.35 + 0.65 * Math.min(1, clampedProgress * 1.5);
      setOpacity(dynamicOpacity);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial calculations with staggered timeout for layout settlement
    updatePosition();
    const timer1 = setTimeout(updatePosition, 80);
    const timer2 = setTimeout(updatePosition, 300);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full py-20 sm:py-28 md:py-32 overflow-hidden relative flex flex-col items-start justify-center select-none bg-brivo-paper border-t border-brivo-navy/10"
    >
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[200px] rounded-full bg-gradient-to-r from-pink-500/10 via-cyan-500/10 to-transparent blur-3xl opacity-70" />
      </div>

      <div
        ref={textRef}
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
          opacity,
          transition: "transform 0.08s ease-out, opacity 0.15s ease-out",
        }}
        className="whitespace-nowrap cursor-default group will-change-transform flex items-center"
      >
        <span className="font-sans font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tighter uppercase text-brivo-navy/[0.10] transition-colors duration-500 group-hover:text-brivo-navy/[0.22]">
          Made with{" "}
          <span className="inline-block text-pink-500 drop-shadow-[0_0_24px_rgba(244,114,182,0.6)] transform group-hover:scale-125 transition-transform duration-300 mx-1.5 sm:mx-3 animate-pulse">
            🩷
          </span>{" "}
          by Kartikey
        </span>
      </div>

      {/* Subtle Micro-Metadata Subtitle */}
      <div className="mt-4 sm:mt-6 w-full flex items-center justify-center gap-2 font-mono text-[0.65rem] sm:text-[0.72rem] tracking-[0.3em] uppercase text-brivo-slate/60">
        <span>LEXGOV PLATFORM ARCHITECTURE</span>
        <span>•</span>
        <span>2026</span>
      </div>
    </section>
  );
}

export default MadeBySignature;
