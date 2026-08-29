import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-coral-500/10 text-coral-500",
        secondary: "bg-white/5 text-slate-500",
        cyan: "bg-teal-500/10 text-teal-600",
        green: "bg-emerald-500/10 text-emerald-600",
        red: "bg-red-500/10 text-red-500",
        yellow: "bg-yellow-500/10 text-yellow-600",
        outline: "border border-white/10 text-slate-500",
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
