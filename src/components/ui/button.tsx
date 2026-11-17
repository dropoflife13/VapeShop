import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "telemetry";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#E86F12] to-[#F58A1F] text-white shadow-[0_0_28px_rgba(232,111,18,0.45)] hover:brightness-110 focus-visible:ring-[#F58A1F]",
  outline:
    "border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] text-[var(--text-primary)] backdrop-blur-md hover:border-[#F58A1F] hover:text-[#E86F12] dark:hover:text-[#F58A1F] focus-visible:ring-[#F58A1F]",
  ghost:
    "text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10 focus-visible:ring-[#F58A1F]",
  telemetry:
    "border border-cyan-400/35 bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-400/20 focus-visible:ring-cyan-300",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[40px] px-4 text-[11px]",
  md: "min-h-[44px] px-6 text-xs",
  lg: "min-h-[48px] px-7 text-xs",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-[0.16em]",
    "transition-all duration-200 ease-out active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
