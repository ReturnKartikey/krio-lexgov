import React from "react";
import { cn } from "@/lib/utils";

interface MicroLabelProps {
  number?: string;
  label: string;
  className?: string;
}

export function MicroLabel({ number = "N°01", label, className }: MicroLabelProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.22em] uppercase text-brivo-slate select-none", className)}>
      <span className="text-brivo-navy font-bold">{number}</span>
      <span className="text-brivo-slate/40">—</span>
      <span className="text-brivo-slate font-medium">{label}</span>
    </div>
  );
}
