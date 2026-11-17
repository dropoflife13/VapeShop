import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "amber" | "telemetry" | "quarantine" | "subtle";

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  amber: "border-[#F58A1F]/35 bg-[#E86F12]/15 text-[#F58A1F]",
  telemetry: "border-cyan-400/35 bg-cyan-400/10 text-cyan-300",
  quarantine: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  subtle: "border-white/15 bg-white/5 text-blue-100/80",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "amber",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        BADGE_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
