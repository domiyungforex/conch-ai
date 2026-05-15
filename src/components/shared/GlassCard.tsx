import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({ className, glow, hover, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        glow && "glow-primary",
        hover && "transition-all duration-300 hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
