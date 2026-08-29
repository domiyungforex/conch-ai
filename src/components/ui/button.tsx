"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-coral-600 text-white hover:bg-coral-500 shadow-sm",
        secondary:
          "bg-white/5 border border-white/10 text-foreground hover:bg-white/10",
        ghost:
          "text-slate-500 hover:text-foreground hover:bg-white/5",
        destructive:
          "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300",
        outline:
          "border border-white/10 text-foreground hover:bg-white/5",
        link:
          "text-coral-500 underline-offset-4 hover:underline hover:text-coral-400",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        xl: "h-12 rounded-lg px-8 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
