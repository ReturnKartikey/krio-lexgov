"use client";

import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface JsonViewerProps {
  data: any;
  title?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, title = "Raw JSON Metadata", defaultExpanded = false }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-brivo-navy/10 rounded-lg bg-white overflow-hidden text-xs shadow-sm">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-2.5 bg-brivo-paper hover:bg-brivo-mist/40 cursor-pointer transition-colors border-b border-brivo-navy/10"
      >
        <div className="flex items-center gap-2 text-brivo-navy font-mono">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-brivo-slate" /> : <ChevronRight className="w-3.5 h-3.5 text-brivo-slate" />}
          <span className="font-semibold text-brivo-navy">{title}</span>
          <span className="text-[0.65rem] text-brivo-slate font-normal">
            ({Object.keys(data || {}).length} keys)
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-brivo-mist text-brivo-navy text-[0.65rem] font-mono transition-colors border border-brivo-navy/15"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-brivo-slate" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {expanded && (
        <div className="p-4 overflow-x-auto max-h-96 bg-brivo-void">
          <pre className="font-mono text-brivo-mist text-[0.75rem] leading-relaxed">
            {jsonStr}
          </pre>
        </div>
      )}
    </div>
  );
}
