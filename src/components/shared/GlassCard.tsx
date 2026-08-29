import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({ className, glow, hover, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl",
        glow && "glow-primary",
        hover && "transition-all duration-200 hover:bg-white/[0.06] hover:-translate-y-px",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
