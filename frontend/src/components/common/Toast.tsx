"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { toast, ToastItem, ToastType } from "@/lib/toast";

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-center sm:items-end gap-2.5 pointer-events-none select-none max-w-sm ml-auto w-full"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => toast.dismiss(item.id)} />
        ))}
      </AnimatePresence>
    </aside>
  );
}

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-brivo-cyan animate-spin shrink-0 mt-0.5" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-brivo-cyan shrink-0 mt-0.5" />;
    }
  };

  const getAccentBorder = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-500/25";
      case "error":
        return "border-rose-500/30";
      case "loading":
        return "border-brivo-cyan/30";
      case "info":
      default:
        return "border-brivo-cyan/25";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl bg-[#0e1726]/95 backdrop-blur-md border ${getAccentBorder(
        item.type
      )} shadow-2xl shadow-black/40 text-left p-3.5 flex items-start gap-3 group transition-colors hover:border-brivo-cyan/50`}
      role="status"
      aria-live="polite"
    >
      {/* Type Icon */}
      {getIcon(item.type)}

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-mono font-medium text-white tracking-tight leading-snug">
          {item.title}
        </div>
        {item.description && (
          <p className="text-[0.72rem] font-sans text-slate-300 leading-relaxed mt-0.5 break-words">
            {item.description}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-md hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-Dismiss Progress Bar */}
      {item.duration > 0 && item.type !== "loading" && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: item.duration / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 h-[2px] bg-brivo-cyan/40"
        />
      )}
    </motion.div>
  );
}
