"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

export interface MoltenTextSegment {
  text: string;
  className?: string;
}

export interface MoltenTextProps {
  text?: string;
  segments?: MoltenTextSegment[];
  className?: string;
}

interface QuickToBundle {
  yTo: (val: number) => void;
  skewTo: (val: number) => void;
  scaleYTo: (val: number) => void;
}

/**
 * MoltenText — Fluid liquid ink typography component.
 *
 * Each character reacts to cursor movement with fluid cosine bell-curve
 * displacement, liquid skew, and viscous momentum.
 * Supports segmented multi-style typography (e.g. sans + italic serif) within
 * a single unified ripple field.
 * Uses persistent GSAP quickTo interpolators so it never degrades after repeat hovers.
 */
export function MoltenText({ text, segments, className = "" }: MoltenTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const quickTosRef = useRef<(QuickToBundle | null)[]>([]);

  // Parse words and their segment styling
  const parsedWords = React.useMemo(() => {
    const list: { word: string; className: string }[] = [];
    if (segments && segments.length > 0) {
      segments.forEach((seg) => {
        const segWords = seg.text.trim().split(/\s+/).filter(Boolean);
        segWords.forEach((word) => {
          list.push({ word, className: seg.className || "" });
        });
      });
    } else if (text) {
      const wordsInText = text.trim().split(/\s+/).filter(Boolean);
      wordsInText.forEach((word) => {
        list.push({ word, className: "" });
      });
    }
    return list;
  }, [text, segments]);

  const totalChars = parsedWords.reduce((acc, item) => acc + Array.from(item.word).length, 0);
  const fullText = parsedWords.map((item) => item.word).join(" ");

  // Initialize persistent GSAP quickTo interpolators
  const initQuickTos = useCallback(() => {
    if (prefersReducedMotion()) return;

    quickTosRef.current = charRefs.current.map((charEl) => {
      if (!charEl) return null;

      const yTo = gsap.quickTo(charEl, "y", {
        duration: 0.35,
        ease: "power2.out",
      });
      const skewTo = gsap.quickTo(charEl, "skewX", {
        duration: 0.38,
        ease: "power2.out",
      });
      const scaleYTo = gsap.quickTo(charEl, "scaleY", {
        duration: 0.35,
        ease: "power2.out",
      });

      return { yTo, skewTo, scaleYTo };
    });
  }, []);

  useEffect(() => {
    charRefs.current = charRefs.current.slice(0, totalChars);
    initQuickTos();
    return () => {
      quickTosRef.current = [];
    };
  }, [initQuickTos, totalChars]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (prefersReducedMotion()) return;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const radius = 120; // Radius of liquid ripple influence in pixels

    charRefs.current.forEach((charEl, idx) => {
      const bundle = quickTosRef.current[idx];
      if (!charEl || !bundle) return;

      const rect = charEl.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;
      const deltaX = mouseX - charCenterX;
      const deltaY = mouseY - charCenterY;
      const dist = Math.hypot(deltaX, deltaY * 1.25);

      if (dist < radius) {
        // Smooth cosine bell-curve for liquid displacement falloff
        const influence = Math.pow(Math.cos((dist / radius) * (Math.PI / 2)), 2);

        // Fluid vertical elevation
        const targetY = -14 * influence;

        // Viscous lean/skew towards cursor flow direction
        const targetSkew = -(deltaX / radius) * 14 * influence;

        // Ink swelling (vertical dilation)
        const targetScaleY = 1 + 0.14 * influence;

        bundle.yTo(targetY);
        bundle.skewTo(targetSkew);
        bundle.scaleYTo(targetScaleY);
      } else {
        bundle.yTo(0);
        bundle.skewTo(0);
        bundle.scaleYTo(1);
      }
    });
  }, []);

  // Clean reset: strictly use quickTo so tweens are NEVER destroyed across repeat hovers
  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion()) return;

    quickTosRef.current.forEach((bundle) => {
      if (!bundle) return;
      bundle.yTo(0);
      bundle.skewTo(0);
      bundle.scaleYTo(1);
    });
  }, []);

  // On touch / tap: cascade a fluid wave using quickTo with micro-delays (no tween destruction)
  const handleTouch = useCallback(() => {
    if (prefersReducedMotion()) return;

    quickTosRef.current.forEach((bundle, i) => {
      if (!bundle) return;
      setTimeout(() => {
        bundle.yTo(-12);
        bundle.skewTo(-8);
        bundle.scaleYTo(1.14);
        setTimeout(() => {
          bundle.yTo(0);
          bundle.skewTo(0);
          bundle.scaleYTo(1);
        }, 220);
      }, i * 28);
    });
  }, []);

  let globalCharIndex = 0;

  return (
    <span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleTouch}
      className={`inline-block max-w-full cursor-pointer select-none py-0.5 will-change-transform ${className}`}
      aria-label={fullText}
      role="text"
    >
      {parsedWords.map((item, wIdx) => (
        <React.Fragment key={wIdx}>
          {wIdx > 0 && <span className="inline-block select-none">&nbsp;</span>}
          <span className={`inline-block whitespace-nowrap ${item.className}`}>
            {Array.from(item.word).map((char) => {
              const charIndex = globalCharIndex++;
              return (
                <span
                  key={charIndex}
                  ref={(el) => {
                    charRefs.current[charIndex] = el;
                  }}
                  className="inline-block transform-gpu will-change-transform"
                  style={{ transformOrigin: "50% 85%" }}
                  aria-hidden="true"
                >
                  {char}
                </span>
              );
            })}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

// Backward-compatible alias
export const MoltenSerif = MoltenText;
