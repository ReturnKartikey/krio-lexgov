"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function EntitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Entities Directory Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Entity Directory Unavailable"
        description="Unable to load the regulatory entity directory and tracked respondent profiles."
        error={error}
        reset={reset}
        backHref="/explorer"
        backLabel="Return to Order Archive"
        showHomeButton={true}
      />
    </div>
  );
}
