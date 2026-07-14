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
        "rounded-xl bg-gradient-to-br from-coral-600 to-gold-600 flex items-center justify-center shadow-lg shadow-coral-500/30 group-hover:shadow-coral-500/50 transition-shadow",
        sizes[size]
      )}>
        {/* A simplified nautilus spiral — Conch's namesake shell, not a generic play/media glyph */}
        <svg viewBox="0 0 24 24" fill="none" className="w-[62%] h-[62%]">
          <path
            d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      <span className={cn(
        "font-serif font-normal text-white",
        size === "sm" && "text-base",
        size === "md" && "text-xl",
        size === "lg" && "text-2xl"
      )}>
        Conch
      </span>
    </Link>
  );
}
