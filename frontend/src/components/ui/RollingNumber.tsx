"use client";

import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

interface RollingNumberProps {
  value: number;
  duration?: number; // in seconds (e.g. 1.0)
  prefix?: string;
  suffix?: string;
  formatAsINR?: boolean;
  decimals?: number;
  className?: string;
}

/**
 * Format a number using Indian numbering system if requested, or standard locale
 */
function formatNumber(val: number, formatAsINR: boolean = false, decimals: number = 0): string {
  if (formatAsINR) {
    if (isNaN(val)) return "0";
    const rounded = Math.round(val);
    const isNegative = rounded < 0;
    const absVal = Math.abs(rounded).toString();

    let lastThree = absVal.substring(absVal.length - 3);
    const otherNumbers = absVal.substring(0, absVal.length - 3);

    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return `${isNegative ? "-" : ""}₹${formatted}`;
  }

  if (decimals > 0) {
    return val.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return Math.round(val).toLocaleString("en-IN");
}

export function RollingNumber({
  value,
  duration = 0.6,
  prefix = "",
  suffix = "",
  formatAsINR = false,
  decimals = 0,
  className = "",
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(() => value);
  const startValRef = useRef<number>(value);
  const prevTargetRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    // Avoid re-rolling if the value hasn't changed
    if (prevTargetRef.current === value && displayValue === value) {
      return;
    }

    startValRef.current = displayValue;
    prevTargetRef.current = value;
    startTimeRef.current = null;
    const targetVal = value;
    const durationMs = duration * 1000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / durationMs, 1);

      // Smooth exponential ease-out curve
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValRef.current + (targetVal - startValRef.current) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formattedText = formatNumber(displayValue, formatAsINR, decimals);

  return (
    <span className={`inline-block tabular-nums font-mono ${className}`}>
      {prefix}
      {formattedText}
      {suffix}
    </span>
  );
}
