"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function OrderDossierError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Order Dossier Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ErrorState
        title="Enforcement Dossier Unavailable"
        description="The requested SEBI adjudication order could not be retrieved from the intelligence index. The record may have been archived or the identifier may be invalid."
        error={error}
        reset={reset}
        backHref="/explorer"
        backLabel="Back to Order Archive"
        showHomeButton={true}
      />
    </div>
  );
}
