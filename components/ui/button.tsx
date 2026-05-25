"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "sn-btn",
        variant === "primary" && "sn-btn-primary",
        variant === "outline" && "sn-btn-outline",
        variant === "ghost" && "bg-transparent hover:bg-black/5",
        size === "sm" && "px-4 py-2 text-sm",
        size === "lg" && "px-8 py-4 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
