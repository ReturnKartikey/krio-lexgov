import { AnalyticsChartsSkeleton } from "@/components/common/Skeleton";
import { MicroLabel } from "@/components/common/MicroLabel";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°03" label="ANALYTICS & AGGREGATIONS" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Enforcement Trends & <span className="font-serif italic font-normal">Market Analytics</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Live aggregated metrics, period-over-period trend velocities, geographic distribution, and near-duplicate cluster detection.
          </p>
        </div>
      </div>
      <AnalyticsChartsSkeleton />
    </div>
  );
}
