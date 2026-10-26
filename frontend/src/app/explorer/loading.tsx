import React from "react";
import { Skeleton, OrderCardSkeleton } from "@/components/common/Skeleton";

export default function ExplorerLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      {/* Filter and Search Controls Bar Skeleton */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Filter Chips & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brivo-navy/5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-18 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
