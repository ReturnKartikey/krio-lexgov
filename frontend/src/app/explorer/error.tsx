"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function ExplorerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Explorer Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Regulatory Order Archive Unavailable"
        description="We couldn't retrieve the regulatory orders archive from the intelligence index. Please check your network connection and try again."
        error={error}
        reset={reset}
        backHref="/"
        backLabel="Return to Overview"
        showHomeButton={true}
      />
    </div>
  );
}
