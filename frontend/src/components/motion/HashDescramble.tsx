"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, ShieldCheck, RefreshCw, Copy } from "lucide-react";
import { toast } from "@/lib/toast";

interface HashDescrambleProps {
  hash: string;
  autoTrigger?: boolean;
  className?: string;
  showCopy?: boolean;
}

const HEX_CHARS = "0123456789abcdef";

export function HashDescramble({
  hash,
  autoTrigger = true,
  className = "",
  showCopy = true,
}: HashDescrambleProps) {
  const [displayText, setDisplayText] = useState(hash);
  const [isScrambling, setIsScrambling] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  const startDescramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);
    setIsVerified(false);

    let iteration = 0;
    const maxIterations = 18;
    const interval = 35;

    const timer = setInterval(() => {
      setDisplayText((prev) =>
        prev
          .split("")
          .map((char, index) => {
            if (index < (iteration / maxIterations) * hash.length) {
              return hash[index];
            }
            return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
          })
          .join("")
      );

      iteration++;
      if (iteration >= maxIterations) {
        clearInterval(timer);
        setDisplayText(hash);
        setIsScrambling(false);
        setIsVerified(true);
      }
    }, interval);
  }, [hash, isScrambling]);

  useEffect(() => {
    if (autoTrigger) {
      const timer = setTimeout(() => {
        startDescramble();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, startDescramble]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.info("SHA-256 Hash Copied", "Cryptographic fingerprint copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={startDescramble}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brivo-paper border border-brivo-navy/10 hover:border-brivo-cyan/50 transition-all cursor-pointer font-mono text-xs select-none group shadow-sm ${
        isVerified ? "border-emerald-500/30 bg-emerald-50/30" : ""
      } ${className}`}
      title="Click to re-verify cryptographic digest"
    >
      <span className="text-brivo-cyan font-semibold flex items-center gap-1">
        {isScrambling ? (
          <RefreshCw className="w-3 h-3 animate-spin text-brivo-cyan" />
        ) : isVerified ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-brivo-slate" />
        )}
      </span>

      <span
        className={`tracking-wider transition-colors font-mono ${
          isVerified ? "text-emerald-800" : isScrambling ? "text-brivo-cyan" : "text-brivo-navy"
        }`}
      >
        {displayText.slice(0, 8)}...{displayText.slice(-8)}
      </span>

      {isVerified && (
        <span className="text-[0.6rem] px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-700 font-semibold uppercase">
          Verified
        </span>
      )}

      {showCopy && (
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-brivo-navy/10 text-brivo-slate hover:text-brivo-navy transition-colors ml-1"
          title="Copy full SHA-256 hash"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}
