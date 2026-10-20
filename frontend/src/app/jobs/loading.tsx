import React from "react";
import { Skeleton, JobsTableSkeleton, MobileTableRowSkeleton } from "@/components/common/Skeleton";

export default function JobsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Stats Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-brivo-navy/10 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Jobs Audit Table Skeleton */}
      <div className="rounded-2xl bg-white border border-brivo-navy/10 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-brivo-navy/10 flex items-center justify-between">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-brivo-paper border-b border-brivo-navy/5 text-brivo-slate">
              <tr>
                <th className="px-4 py-3 font-semibold">Run ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Triggered By</th>
                <th className="px-4 py-3 font-semibold">Started At</th>
                <th className="px-4 py-3 font-semibold text-center">Found</th>
                <th className="px-4 py-3 font-semibold text-center">Added</th>
                <th className="px-4 py-3 font-semibold text-center">Updated</th>
                <th className="px-4 py-3 font-semibold text-center">Errors</th>
                <th className="px-4 py-3 font-semibold text-right">Duration</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              <JobsTableSkeleton count={6} />
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="p-4 block md:hidden">
          <MobileTableRowSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}
