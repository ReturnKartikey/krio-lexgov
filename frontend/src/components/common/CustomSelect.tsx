"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md" | "compact";
  icon?: React.ReactNode;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  size = "md",
  icon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    compact: "py-0.5 px-2 text-[0.75rem] font-mono h-7",
    sm: "py-1 px-2.5 text-xs font-mono h-8",
    md: "py-1.5 px-3 text-xs tracking-snug h-9.5",
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg bg-brivo-paper border border-brivo-navy/15 text-brivo-navy transition-all duration-150 cursor-pointer shadow-2xs hover:border-brivo-navy/35 hover:bg-white focus:outline-none focus:border-brivo-navy/50 ${sizeClasses[size]} ${
          isOpen ? "border-brivo-navy/40 bg-white ring-1 ring-brivo-navy/10" : ""
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate text-left">
          {icon && <span className="text-brivo-slate shrink-0">{icon}</span>}
          <span className={`truncate ${!selectedOption && placeholder ? "text-brivo-slate/70" : "font-medium text-brivo-navy"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-brivo-slate shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brivo-navy" : ""
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute left-0 z-50 mt-1 max-h-60 min-w-[140px] overflow-y-auto rounded-xl bg-white border border-brivo-navy/15 p-1 shadow-xl shadow-brivo-navy/10 custom-scrollbar ${menuClassName}`}
            style={{ width: "100%", minWidth: "max-content" }}
            role="listbox"
          >
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-brivo-navy text-brivo-paper font-medium"
                      : "text-brivo-navy hover:bg-brivo-mist/80 hover:text-brivo-navy"
                  }`}
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className={`text-[0.65rem] font-mono ${isSelected ? "text-brivo-cyan/80" : "text-brivo-slate"}`}>
                        {opt.subLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span
                        className={`text-[0.65rem] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-brivo-paper/20 text-white" : "bg-brivo-paper text-brivo-slate border border-brivo-navy/10"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-brivo-cyan shrink-0" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
