import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({ className, glow, hover, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        glow && "glow-primary",
        hover && "transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-px hover:shadow-lg hover:shadow-black/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
