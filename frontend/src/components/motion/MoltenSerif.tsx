"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

interface MoltenTextProps {
  text: string;
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
 * Uses persistent GSAP quickTo interpolators so it never degrades after repeat hovers.
 */
export function MoltenText({ text, className = "" }: MoltenTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const quickTosRef = useRef<(QuickToBundle | null)[]>([]);

  // Split into words to preserve natural CSS line-wrapping on mobile
  const words = text.split(" ");
  const totalChars = words.reduce((acc, w) => acc + Array.from(w).length, 0);

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
    initQuickTos();
    return () => {
      quickTosRef.current = [];
    };
  }, [initQuickTos, text]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (prefersReducedMotion()) return;
    const mouseX = e.clientX;
    const radius = 120; // Radius of liquid ripple influence in pixels

    charRefs.current.forEach((charEl, idx) => {
      const bundle = quickTosRef.current[idx];
      if (!charEl || !bundle) return;

      const rect = charEl.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const deltaX = mouseX - charCenterX;
      const dist = Math.abs(deltaX);

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
      }, i * 30);
    });
  }, []);

  let globalCharIndex = 0;

  return (
    <span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleTouch}
      className={`inline-block cursor-pointer select-none py-0.5 will-change-transform ${className}`}
      aria-label={text}
      role="text"
    >
      {words.map((word, wIdx) => (
        <React.Fragment key={wIdx}>
          {wIdx > 0 && <span className="inline-block">&nbsp;</span>}
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((char) => {
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
