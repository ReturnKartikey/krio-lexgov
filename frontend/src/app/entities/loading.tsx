import React from "react";
import { Skeleton } from "@/components/common/Skeleton";

export default function EntitiesLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-12 sm:pb-20 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-80 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="p-3 rounded-xl bg-white border border-brivo-navy/10 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-2xs">
        <Skeleton className="h-9 w-full sm:w-72 lg:w-80 rounded-lg shrink-0" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-white border border-brivo-navy/10 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <div className="pt-3 border-t border-brivo-navy/10 flex justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
