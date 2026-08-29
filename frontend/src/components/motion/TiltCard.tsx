"use client";

import React, { useRef, useEffect } from "react";
import { createTiltEffect } from "@/lib/motion";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 2.5,
  className = "",
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const cleanup = createTiltEffect(cardRef.current, { maxTilt });
    return cleanup;
  }, [maxTilt]);

  return (
    <div
      ref={cardRef}
      className={`will-change-transform transform-gpu ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
