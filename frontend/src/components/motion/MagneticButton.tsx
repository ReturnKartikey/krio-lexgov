"use client";

import React, { useRef, useEffect } from "react";
import { createMagneticEffect } from "@/lib/motion";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className = "",
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;
    const cleanup = createMagneticEffect(buttonRef.current, { strength });
    return cleanup;
  }, [strength]);

  return (
    <button
      ref={buttonRef}
      className={`btn-shine-sweep will-change-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
