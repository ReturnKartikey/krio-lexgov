import React from "react";
import { cn } from "@/lib/utils";
interface SectionHeadingProps {
  microNumber?: string;
  microLabel?: string;
  title: string;
  italicWord?: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({
  title,
  italicWord,
  subtitle,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-brivo-navy leading-tight font-sans">
        {title} {italicWord && <span className="font-serif italic font-normal text-brivo-navy">{italicWord}</span>}
      </h2>
      {subtitle && <p className="text-sm text-brivo-slate max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}
