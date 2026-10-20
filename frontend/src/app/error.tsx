"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Application Error Caught:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <ErrorState
        title="Application Service Disrupted"
        description="We encountered an unexpected error while rendering this view. You can reload the page or return to the regulatory overview."
        error={error}
        reset={reset}
        showHomeButton={true}
      />
    </div>
  );
}
