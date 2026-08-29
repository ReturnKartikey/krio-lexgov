"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { IntelligenceModal } from "./IntelligenceModal";

interface SynthesizeButtonProps {
  query?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export function SynthesizeButton({
  query = "",
  label = "Synthesize Statutory Brief",
  variant = "outline",
  className = "",
}: SynthesizeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const baseStyles = "inline-flex items-center gap-1.5 font-mono text-xs rounded-full transition-all shadow-sm active:scale-95";
  const variantStyles = {
    primary: "bg-brivo-navy hover:bg-brivo-navy/90 text-brivo-paper px-4 py-2 font-medium",
    secondary: "bg-brivo-paper hover:bg-brivo-mist text-brivo-navy border border-brivo-navy/15 px-4 py-2",
    outline: "bg-white hover:bg-brivo-paper border border-brivo-navy/15 text-brivo-navy px-3.5 py-1.5 hover:border-brivo-cyan/50",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        title="Open AI Precedent & Risk Synthesizer"
      >
        <span className="w-2 h-2 rounded-full bg-brivo-cyan animate-pulse" />
        <span>{label}</span>
      </button>

      <IntelligenceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialQuery={query}
      />
    </>
  );
}
