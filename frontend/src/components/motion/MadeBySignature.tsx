"use client";

import React from "react";

export function MadeBySignature() {
  return (
    <section className="w-full py-20 sm:py-28 md:py-32 overflow-hidden relative flex flex-col items-center justify-center select-none bg-brivo-paper border-t border-brivo-navy/10">
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[200px] rounded-full bg-gradient-to-r from-pink-500/10 via-cyan-500/10 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="w-full flex items-center justify-center px-4 sm:px-6 text-center cursor-default group">
        <span className="font-sans font-black text-[clamp(1.35rem,5.2vw,6.5rem)] tracking-tighter uppercase text-brivo-navy/[0.10] transition-colors duration-500 group-hover:text-brivo-navy/[0.22] whitespace-nowrap">
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
