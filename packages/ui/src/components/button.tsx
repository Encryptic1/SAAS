import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "outline" && "border border-gray-300 bg-white hover:bg-gray-50",
        variant === "ghost" && "hover:bg-gray-100",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className,
      )}
      {...props}
    />
  );
}
