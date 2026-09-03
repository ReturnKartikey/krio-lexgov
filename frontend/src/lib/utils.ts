import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount?: number | null): string {
  if (amount === undefined || amount === null) return "—";
  if (amount === 0) return "₹0";

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(lakh % 1 === 0 ? 0 : 2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[month - 1]} ${day}, ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

export function truncateText(text?: string | null, length: number = 120): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "...";
}

export function formatCleanSummary(title?: string | null, summary?: string | null): string {
  if (!summary) return "No extracted summary available.";
  const cleanSummary = summary.trim();
  if (!title) return cleanSummary;

  const cleanTitle = title.trim().replace(/\.+$/, "").toLowerCase();
  if (cleanSummary.toLowerCase().startsWith(cleanTitle)) {
    const remaining = cleanSummary.slice(cleanTitle.length).replace(/^[\.\s,:-]+/, "").trim();
    if (remaining.length > 20) {
      return remaining.charAt(0).toUpperCase() + remaining.slice(1);
    }
  }
  return cleanSummary;
}

