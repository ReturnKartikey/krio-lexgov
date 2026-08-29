import React from "react";

interface HighlightedTextProps {
  text?: string | null;
  highlight?: string | null;
  className?: string;
}

export function HighlightedText({ text, highlight, className = "" }: HighlightedTextProps) {
  if (!text) return null;
  if (!highlight || !highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const query = highlight.trim();
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-brivo-mist text-brivo-navy font-medium px-1 rounded border border-brivo-cyan/40">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
