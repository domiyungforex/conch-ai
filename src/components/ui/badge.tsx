import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        secondary: "border-white/10 bg-white/5 text-slate-300",
        cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        red: "border-red-500/30 bg-red-500/10 text-red-300",
        yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
        outline: "border-white/20 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
