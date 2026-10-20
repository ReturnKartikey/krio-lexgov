"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf8fc] text-[#1a2333] flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-lg p-8 rounded-2xl bg-white border border-[#1a2333]/15 shadow-sm text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#1a2333]/5 text-[#475467]">
              Critical Application Error
            </span>
            <h1 className="text-2xl font-normal text-[#1a2333] tracking-tight">
              Root System Interrupted
            </h1>
            <p className="text-sm text-[#475467] leading-relaxed">
              A foundational layout error occurred. You can attempt to reload the application shell below.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a2333] text-white hover:bg-[#0b1020] text-xs font-mono font-medium transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reload Application
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#1a2333]/15 text-[#1a2333] hover:bg-[#faf8fc] text-xs font-mono font-medium transition-colors"
            >
              Home
            </a>
          </div>

          {error && error.digest && (
            <div className="pt-3 text-[11px] font-mono text-[#98a2b3]">
              Diagnostic Reference: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
