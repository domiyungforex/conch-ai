import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, size = "md", href = "/" }: LogoProps) {
  const sizes = { sm: "w-6 h-6 text-sm", md: "w-8 h-8 text-base", lg: "w-10 h-10 text-lg" };

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div className={cn(
        "rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow",
        sizes[size]
      )}>
        <svg viewBox="0 0 24 24" fill="none" className="w-[55%] h-[55%]">
          <path
            d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1 13V8l7 4-7 4z"
            fill="white"
          />
        </svg>
      </div>
      <span className={cn(
        "font-semibold text-white",
        size === "sm" && "text-sm",
        size === "md" && "text-lg",
        size === "lg" && "text-2xl"
      )}>
        Conch
      </span>
    </Link>
  );
}
