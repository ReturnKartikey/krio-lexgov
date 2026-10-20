"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jobs Ingestion Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Ingestion Audit Log Unavailable"
        description="Unable to communicate with the registry crawler worker or retrieve recent ingestion runs. The background worker may be restarting or the database connection is temporarily saturated."
        error={error}
        reset={reset}
        backHref="/explorer"
        backLabel="Browse Order Archive"
        showHomeButton={true}
      />
    </div>
  );
}
