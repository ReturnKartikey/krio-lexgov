"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

// Register ScrollTrigger once on client side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger, SplitType };

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate hero headline letters and lines using SplitType
 */
export function animateHeroHeadline(
  target: HTMLElement | string,
  onComplete?: () => void
) {
  if (prefersReducedMotion()) return null;

  try {
    const split = new SplitType(target, {
      types: "lines,words,chars",
      tagName: "span",
    });

    // Animate characters with fluid power4.out
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      },
    });

    tl.fromTo(
      split.chars,
      {
        opacity: 0,
        y: 40,
        filter: "blur(8px)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.85,
        stagger: 0.015,
        ease: "power4.out",
        clearProps: "filter,transform",
      }
    );

    return { split, tl };
  } catch (err) {
    console.error("Hero text split failed:", err);
    return null;
  }
}

/**
 * Create a magnetic pull effect towards the mouse cursor
 */
export function createMagneticEffect(
  element: HTMLElement,
  options?: { strength?: number; textPull?: boolean }
) {
  if (prefersReducedMotion()) return () => {};

  const strength = options?.strength ?? 0.35;
  const maxMove = 10; // Max 10px translate to maintain elegance

  const xTo = gsap.quickTo(element, "x", { duration: 0.6, ease: "power3.out" });
  const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "power3.out" });

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    const clampedX = Math.max(-maxMove, Math.min(maxMove, deltaX));
    const clampedY = Math.max(-maxMove, Math.min(maxMove, deltaY));

    xTo(clampedX);
    yTo(clampedY);
  };

  const handleMouseLeave = () => {
    xTo(0);
    yTo(0);
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Create a subtle 3D card tilt effect (max 2-3 degrees)
 */
export function createTiltEffect(
  element: HTMLElement,
  options?: { maxTilt?: number }
) {
  if (prefersReducedMotion()) return () => {};

  const maxTilt = options?.maxTilt ?? 3.0; // Subtle, never exaggerated

  const rotateXTo = gsap.quickTo(element, "rotationX", {
    duration: 0.7,
    ease: "power3.out",
  });
  const rotateYTo = gsap.quickTo(element, "rotationY", {
    duration: 0.7,
    ease: "power3.out",
  });
  const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "power3.out" });

  // Set perspective on parent
  if (element.parentElement) {
    element.parentElement.style.perspective = "1200px";
  }

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    rotateXTo(rotateX);
    rotateYTo(rotateY);
    yTo(-6); // Lift upward 6px
  };

  const handleMouseLeave = () => {
    rotateXTo(0);
    rotateYTo(0);
    yTo(0);
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Animate a numeric counter from start to end with exponential easing
 */
export function animateCounter(
  element: HTMLElement,
  endValue: number,
  options?: {
    duration?: number;
    prefix?: string;
    suffix?: string;
    formatter?: (v: number) => string;
  }
) {
  if (prefersReducedMotion()) {
    element.textContent = options?.formatter
      ? options.formatter(endValue)
      : `${options?.prefix || ""}${endValue}${options?.suffix || ""}`;
    return;
  }

  const duration = options?.duration || 1.8;
  const obj = { val: 0 };

  gsap.to(obj, {
    val: endValue,
    duration,
    ease: "power3.out",
    onUpdate: () => {
      const current = Math.round(obj.val);
      if (options?.formatter) {
        element.textContent = options.formatter(current);
      } else {
        element.textContent = `${options?.prefix || ""}${current.toLocaleString()}${options?.suffix || ""}`;
      }
    },
  });
}
