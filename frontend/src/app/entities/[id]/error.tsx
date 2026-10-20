"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function EntityDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Entity Detail Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Entity Profile Unavailable"
        description="Unable to load the regulatory enforcement track record and cross-linked order history for this entity."
        error={error}
        reset={reset}
        backHref="/explorer"
        backLabel="Return to Order Archive"
        showHomeButton={true}
      />
    </div>
  );
}
