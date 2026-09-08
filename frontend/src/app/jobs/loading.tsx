import { JobsTableSkeleton, MobileTableRowSkeleton } from "@/components/common/Skeleton";
import { MicroLabel } from "@/components/common/MicroLabel";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-10 sm:pb-16 space-y-6 sm:space-y-8 min-h-[85vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°04" label="ETL ORCHESTRATION" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Crawler Ingestion <span className="font-serif italic font-normal">Audit Log</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Monitor background scheduled synchronizations, rate-limit state, record updates, and error transcripts.
          </p>
        </div>
      </div>

      {/* Desktop Ingestion Runs Table */}
      <div className="border border-brivo-navy/10 rounded-lg overflow-x-auto bg-white shadow-sm hidden md:block">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-brivo-paper text-brivo-slate font-mono uppercase text-[0.65rem] tracking-wider border-b border-brivo-navy/10">
            <tr>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trigger Source</th>
              <th className="px-4 py-3">Started At</th>
              <th className="px-4 py-3 text-center">Seen</th>
              <th className="px-4 py-3 text-center">Added</th>
              <th className="px-4 py-3 text-center">Updated</th>
              <th className="px-4 py-3 text-center">Failed</th>
              <th className="px-4 py-3 text-right">Duration</th>
              <th className="px-4 py-3 text-right">Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brivo-navy/5">
            <JobsTableSkeleton count={6} />
          </tbody>
        </table>
      </div>

      {/* Mobile Card List Skeleton */}
      <MobileTableRowSkeleton count={4} />
    </div>
  );
}
