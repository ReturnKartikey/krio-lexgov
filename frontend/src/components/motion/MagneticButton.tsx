import React from "react";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MagneticButton({
  children,
  className = "",
  ...props
}: MagneticButtonProps) {
  return (
    <button
      className={`btn-shine-sweep transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
