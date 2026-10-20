"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Analytics Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Market Analytics Processing Error"
        description="Unable to compute regulatory enforcement trends and geographic distribution metrics. This may be due to an analytical query timeout or database aggregation failure."
        error={error}
        reset={reset}
        backHref="/explorer"
        backLabel="Browse Order Archive"
        showHomeButton={true}
      />
    </div>
  );
}
