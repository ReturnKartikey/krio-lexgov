"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import { Sparkles, Radio, Shield, MessageSquare, Volume2 } from "lucide-react";

const REGULATORY_INSIGHTS = [
  "Tip: Press ⌘K anywhere to synthesize live market precedent briefs.",
  "All 35 indexed SEBI orders verified against immutable SHA-256 digests.",
  "Section 15HA carries a ₹25 Crore statutory ceiling for PFUTP violations.",
  "Near-duplicate clustering connects synchronized trading accounts automatically.",
  "SEBI Adjudication Rules strictly mandate evidentiary electronic audit trails.",
];

export function MascotSentinel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pupilLeftRef = useRef<SVGCircleElement>(null);
  const pupilRightRef = useRef<SVGCircleElement>(null);
  const monocleRef = useRef<SVGGElement>(null);
  const leftWingRef = useRef<SVGGElement>(null);
  const rightWingRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const scanBeamRef = useRef<SVGPathElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isCelebrated, setIsCelebrated] = useState(false);

  // 13. "Sentinel Sentry Mode" on Unfocused Tab
  useEffect(() => {
    const originalTitle = document.title;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = "(●) Krio Sentinel Scanning...";
        setIsScanning(true);
      } else {
        document.title = originalTitle;
        setIsScanning(false);
        triggerWingWave();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = originalTitle;
    };
  }, []);

  const triggerWingWave = useCallback(() => {
    if (rightWingRef.current) {
      gsap.fromTo(
        rightWingRef.current,
        { rotation: 0, transformOrigin: "bottom left" },
        {
          rotation: -28,
          duration: 0.28,
          yoyo: true,
          repeat: 3,
          ease: "power2.inOut",
        }
      );
    }
  }, []);

  const handleMascotClick = () => {
    // Cycle insight
    setCurrentInsightIndex((prev) => (prev + 1) % REGULATORY_INSIGHTS.length);
    setShowSpeechBubble(true);
    triggerWingWave();

    // Trigger laser radar scan
    if (scanBeamRef.current) {
      gsap.fromTo(
        scanBeamRef.current,
        { opacity: 0, scale: 0.5, transformOrigin: "26px 26px" },
        {
          opacity: 0.9,
          scale: 1.5,
          duration: 0.6,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    }
  };

  useEffect(() => {
    if (prefersReducedMotion()) return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Continuous breathing & hovering bob
    const floatTween = gsap.to(bodyRef.current, {
      y: -6,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    // 2. Randomized realistic double-blink
    let blinkTimer: NodeJS.Timeout;
    const triggerBlink = () => {
      if (pupilLeftRef.current && pupilRightRef.current) {
        gsap.to([pupilLeftRef.current, pupilRightRef.current], {
          scaleY: 0.08,
          transformOrigin: "center center",
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          onComplete: () => {
            blinkTimer = setTimeout(triggerBlink, 2800 + Math.random() * 3500);
          },
        });
      }
    };
    blinkTimer = setTimeout(triggerBlink, 2000);

    // 3. Precision Mouse Eye Tracking with Damping
    const leftXTo = gsap.quickTo(pupilLeftRef.current, "x", { duration: 0.35, ease: "power3.out" });
    const leftYTo = gsap.quickTo(pupilLeftRef.current, "y", { duration: 0.35, ease: "power3.out" });
    const rightXTo = gsap.quickTo(pupilRightRef.current, "x", { duration: 0.35, ease: "power3.out" });
    const rightYTo = gsap.quickTo(pupilRightRef.current, "y", { duration: 0.35, ease: "power3.out" });
    const monocleXTo = gsap.quickTo(monocleRef.current, "x", { duration: 0.45, ease: "power3.out" });
    const monocleYTo = gsap.quickTo(monocleRef.current, "y", { duration: 0.45, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = Math.max(-5, Math.min(5, (e.clientX - centerX) * 0.035));
      const deltaY = Math.max(-4, Math.min(4, (e.clientY - centerY) * 0.035));

      leftXTo(deltaX);
      leftYTo(deltaY);
      rightXTo(deltaX);
      rightYTo(deltaY);
      monocleXTo(deltaX * 0.6);
      monocleYTo(deltaY * 0.6);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 4. Scroll entry celebration
    let trigger: ScrollTrigger | null = null;
    if (containerRef.current) {
      trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 88%",
        onEnter: () => {
          triggerWingWave();
          setIsCelebrated(true);
          setTimeout(() => setShowSpeechBubble(true), 600);
        },
      });
    }

    return () => {
      floatTween.kill();
      clearTimeout(blinkTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      trigger?.kill();
    };
  }, [triggerWingWave]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none group">
      {/* Speech Bubble / Tactical Insight Whisper */}
      {showSpeechBubble && (
        <div
          onClick={() => setShowSpeechBubble(false)}
          className="absolute -top-16 bg-white/95 backdrop-blur-md border border-brivo-navy/15 rounded-xl px-3.5 py-2 shadow-xl text-brivo-navy text-[0.7rem] font-mono max-w-xs text-center animate-fade-in cursor-pointer z-30 flex items-center gap-2 group-hover:border-brivo-cyan"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brivo-cyan shrink-0 animate-pulse" />
          <span className="leading-tight">{REGULATORY_INSIGHTS[currentInsightIndex]}</span>
          <span className="text-[0.6rem] text-brivo-slate shrink-0 font-sans">✕</span>
        </div>
      )}

      {/* Interactive Mascot Container */}
      <div
        ref={containerRef}
        onClick={handleMascotClick}
        className="relative cursor-pointer p-2 transition-transform duration-300 group-hover:scale-105"
        title="Click Krio Sentinel to trigger radar scan and tactical insights"
      >
        {/* Glowing Radar Halo */}
        <div
          className={`absolute inset-0 rounded-full bg-brivo-cyan/20 blur-xl transition-all duration-700 pointer-events-none ${
            isCelebrated || isScanning ? "opacity-100 scale-125" : "opacity-0"
          }`}
        />

        {/* Larger, Articulated 88x88 Vector Sentinel Character */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 filter drop-shadow-[0_10px_20px_rgba(11,16,32,0.4)]"
        >
          {/* Laser Scanner Radar Cone (Animated) */}
          <path
            ref={scanBeamRef}
            d="M34 36 L12 68 L56 68 Z"
            fill="url(#scanGradient)"
            opacity="0"
            className="pointer-events-none"
          />

          <g ref={bodyRef}>
            {/* Left Articulated Wing */}
            <g ref={leftWingRef}>
              <path
                d="M20 34 C12 40 10 54 22 62 C24 54 22 42 22 34 Z"
                fill="#1a2333"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.2"
              />
              <path d="M14 44 C18 48 20 54 22 58" stroke="#00c2d1" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Right Articulated Wing (Waving) */}
            <g ref={rightWingRef}>
              <path
                d="M68 34 C76 40 78 54 66 62 C64 54 66 42 66 34 Z"
                fill="#1a2333"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.2"
              />
              <path d="M74 44 C70 48 68 54 66 58" stroke="#00c2d1" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Main Torso Shield / Armor */}
            <path
              d="M44 10 L66 22 V48 C66 64 44 78 44 78 C44 78 22 64 22 48 V22 L44 10Z"
              fill="#1a2333"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />

            {/* Geometric Crown / Ear Crests */}
            <path
              d="M34 14 L44 8 L54 14"
              stroke="#00c2d1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon points="44,5 41,11 47,11" fill="#00c2d1" />

            {/* Left Eye Aperture */}
            <circle cx="34" cy="36" r="8" fill="#faf8fc" />
            <circle ref={pupilLeftRef} cx="34" cy="36" r="3.8" fill="#0b1020" />
            <circle cx="35.5" cy="34.5" r="1.2" fill="#00c2d1" />

            {/* Right Eye Aperture */}
            <circle cx="54" cy="36" r="8" fill="#faf8fc" />
            <circle ref={pupilRightRef} cx="54" cy="36" r="3.8" fill="#0b1020" />
            <circle cx="55.5" cy="34.5" r="1.2" fill="#00c2d1" />

            {/* Cyan Monocle on Left Eye */}
            <g ref={monocleRef}>
              <circle
                cx="34"
                cy="36"
                r="9.5"
                stroke="#00c2d1"
                strokeWidth="1.8"
                fill="none"
              />
              <path d="M43.5 36 L47 36" stroke="#00c2d1" strokeWidth="1.5" />
            </g>

            {/* Beak / Prism */}
            <polygon points="44,42 40,48 48,48" fill="#00c2d1" />

            {/* Chest Monogram Plaque 'K' */}
            <rect
              x="36"
              y="54"
              width="16"
              height="16"
              rx="4"
              fill="#0b1020"
              stroke="rgba(0,194,209,0.4)"
              strokeWidth="1"
            />
            <text
              x="44"
              y="66"
              textAnchor="middle"
              fontFamily="var(--font-serif), Georgia, serif"
              fontStyle="italic"
              fontSize="12"
              fontWeight="bold"
              fill="#d9f5f8"
            >
              k
            </text>
          </g>

          <defs>
            <linearGradient id="scanGradient" x1="34" y1="36" x2="34" y2="68" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00c2d1" stopOpacity="0.6" />
              <stop offset="1" stopColor="#00c2d1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Interactive Badge Below Mascot */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-brivo-cyan animate-ping" />
        <span className="font-mono text-[0.65rem] tracking-[0.22em] text-brivo-slate uppercase">
          KRIO // VIGILANT SENTINEL
        </span>
      </div>
    </div>
  );
}
