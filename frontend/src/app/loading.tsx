import React from "react";
import { Skeleton } from "@/components/common/Skeleton";

export default function RootLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Action bar skeleton */}
      <div className="flex items-center justify-between border-b border-brivo-navy/10 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
          <span className="text-brivo-navy/20 font-mono text-xs">/</span>
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Hero / Header Shell */}
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-36 rounded" />
        <Skeleton className="h-9 sm:h-11 w-3/5 rounded-lg" />
        <Skeleton className="h-4 w-2/5 rounded" />
      </div>

      {/* Metric Cards Shell */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-brivo-navy/10 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-7 w-28 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Placeholder */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm min-h-[300px]">
        <div className="flex items-center justify-between border-b border-brivo-navy/5 pb-4">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-11/12 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
}
