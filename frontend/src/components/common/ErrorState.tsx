"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Home,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  backHref?: string;
  backLabel?: string;
  showHomeButton?: boolean;
}

export function ErrorState({
  title = "An unexpected error occurred",
  description = "The requested data or view could not be rendered. Our system has logged the diagnostic event.",
  error,
  reset,
  backHref,
  backLabel = "Go Back",
  showHomeButton = true,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full max-w-2xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-white border border-brivo-navy/15 shadow-sm text-center space-y-6"
    >
      {/* Icon Badge */}
      <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
        <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
      </div>

      {/* Heading & Summary */}
      <div className="space-y-2">
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase bg-brivo-navy/[0.04] text-brivo-slate">
          Runtime Boundary Notice
        </div>
        <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-brivo-navy font-sans">
          {title}
        </h2>
        <p className="text-sm text-brivo-slate max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {reset && (
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brivo-navy text-brivo-paper hover:bg-brivo-void text-xs font-mono font-medium shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        )}

        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-brivo-navy/15 text-brivo-navy hover:bg-brivo-mist/40 text-xs font-mono font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brivo-slate" />
            {backLabel}
          </Link>
        )}

        {showHomeButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-brivo-navy/15 text-brivo-navy hover:bg-brivo-mist/40 text-xs font-mono font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-brivo-slate" />
            Overview
          </Link>
        )}
      </div>

      {/* Technical Diagnostics Collapsible */}
      {error && (
        <div className="pt-4 border-t border-brivo-navy/10 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-1 text-xs font-mono text-brivo-slate hover:text-brivo-navy transition-colors select-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Technical Diagnostics
              {error.digest && (
                <span className="text-[10px] text-brivo-slate/70">
                  (Digest: {error.digest.slice(0, 8)})
                </span>
              )}
            </span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-brivo-void text-brivo-paper font-mono text-[11px] leading-relaxed overflow-x-auto border border-brivo-navy/20 space-y-1.5">
              <div className="text-rose-400 font-semibold">
                {error.name || "Error"}: {error.message || "Unknown error"}
              </div>
              {error.digest && (
                <div className="text-brivo-slate text-[10px]">
                  Internal Trace ID: {error.digest}
                </div>
              )}
              {error.stack && (
                <pre className="text-brivo-slate/90 text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto pt-2 border-t border-white/10 font-mono">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
