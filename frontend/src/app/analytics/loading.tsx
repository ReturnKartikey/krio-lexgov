import React from "react";
import { Skeleton, AnalyticsChartsSkeleton } from "@/components/common/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-10 animate-fade-in">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-80 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>

      {/* Analytics Charts & KPI Cards Skeleton */}
      <AnalyticsChartsSkeleton />
    </div>
  );
}
