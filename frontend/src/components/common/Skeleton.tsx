import React from "react";
import clsx from "clsx";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  dark?: boolean;
}

export function Skeleton({ className = "", dark = false, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "rounded",
        dark ? "skeleton-shimmer-dark bg-white/5" : "skeleton-shimmer bg-brivo-navy/[0.04]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton matching the exact geometry of an Order Card in /explorer
 */
export function OrderCardSkeleton() {
  return (
    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-brivo-navy/10 space-y-3.5 shadow-sm">
      {/* Header: Upper Tags (Left) & Penalty Amount (Right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-6 w-24 rounded-md shrink-0" />
      </div>

      {/* Title & Summary */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-4/5 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>

      {/* Noticees & Actions */}
      <div className="pt-3.5 border-t border-brivo-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton matching table rows in /explorer
 */
export function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-brivo-navy/5">
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-24 rounded" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-24 rounded" />
          </td>
          <td className="px-5 py-4 space-y-1.5 max-w-md">
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-20 rounded" />
          </td>
          <td className="px-5 py-4 text-right">
            <Skeleton className="h-4 w-24 ml-auto rounded" />
          </td>
          <td className="px-5 py-4 text-right">
            <Skeleton className="h-7 w-16 ml-auto rounded-md" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Mobile-specific card skeleton for tables in /explorer and /jobs
 */
export function MobileTableRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 block md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-white border border-brivo-navy/10 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
          </div>
          <div className="pt-2 border-t border-brivo-navy/5 flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton matching jobs audit log table rows
 */
export function JobsTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-brivo-navy/5">
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-20 rounded" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-5 w-18 rounded-md" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-24 rounded" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-28 rounded" />
          </td>
          <td className="px-4 py-3.5 text-center">
            <Skeleton className="h-4 w-8 mx-auto rounded" />
          </td>
          <td className="px-4 py-3.5 text-center">
            <Skeleton className="h-4 w-8 mx-auto rounded" />
          </td>
          <td className="px-4 py-3.5 text-center">
            <Skeleton className="h-4 w-8 mx-auto rounded" />
          </td>
          <td className="px-4 py-3.5 text-center">
            <Skeleton className="h-4 w-8 mx-auto rounded" />
          </td>
          <td className="px-4 py-3.5 text-right">
            <Skeleton className="h-4 w-12 ml-auto rounded" />
          </td>
          <td className="px-4 py-3.5 text-right">
            <Skeleton className="h-6 w-6 ml-auto rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton for /analytics page (KPIs, Charts, Breakdowns)
 */
export function AnalyticsChartsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-brivo-navy/10 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Main Time-Series Chart Box */}
      <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brivo-navy/5 pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-44 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
        {/* Shimmer Chart Canvas placeholder */}
        <div className="h-64 sm:h-80 w-full flex items-end gap-3 pt-6 pb-2 px-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full">
              <Skeleton
                className="w-full rounded-t"
                style={{ height: `${20 + ((i * 17) % 75)}%` }}
              />
              <Skeleton className="h-2 w-full max-w-[28px] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Noticees */}
        <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-brivo-navy/5 pb-3">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-48 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Geo Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-brivo-navy/5 pb-3">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3.5 w-32 rounded" />
                </div>
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton matching legal order dossier (/explorer/[id])
 */
export function DossierSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brivo-navy/10 pb-4 gap-4">
        <Skeleton className="h-4 w-36 rounded" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Main Header */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-8 sm:h-10 w-4/5 rounded" />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white border border-brivo-navy/10 space-y-1.5 shadow-sm"
          >
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Executive Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-brivo-navy/10 pb-4">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>

      {/* Cited Noticees Grid */}
      <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <Skeleton className="h-5 w-36 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-brivo-paper border border-brivo-navy/10 space-y-2"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-40 rounded" />
              <div className="flex justify-between pt-2 border-t border-brivo-navy/10">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton matching entity detail page (/entities/[id])
 */
export function EntitySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-8 animate-fade-in">
      <Skeleton className="h-4 w-32 rounded" />
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-2/3 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-brivo-navy/10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <Skeleton className="h-5 w-48 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-brivo-paper border border-brivo-navy/10 space-y-2"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-4.5 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Intelligence modal analysis body
 */
export function AIPaneSkeleton() {
  return (
    <div className="space-y-4 py-2 animate-fade-in">
      {/* Header pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded" />
      </div>

      {/* Summary paragraphs */}
      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 space-y-2.5">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>

      {/* 3 Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-white border border-brivo-navy/10 space-y-1.5"
          >
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Key findings bullet list */}
      <div className="p-4 rounded-xl bg-white border border-brivo-navy/10 space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
