import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "full";
}

export function GradientText({ className, variant = "primary", children, ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        variant === "full" ? "gradient-text-full" : "gradient-text",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
