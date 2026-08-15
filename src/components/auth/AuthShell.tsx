import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { GlassCard } from "@/components/shared/GlassCard";
import { NautilusSpiral } from "@/components/shared/NautilusSpiral";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: { label: string; linkLabel: string; href: string };
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
      {/* Archive backdrop — warm glow + memory lattice */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute inset-0 memory-lattice opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none" />
      <NautilusSpiral
        size={420}
        className="absolute -right-44 -top-44 pointer-events-none opacity-[0.07]"
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <p className="eyebrow text-coral-600 mt-5">The memory layer for AI</p>
        </div>

        <GlassCard className="p-8">
          <div className="text-center mb-7">
            <h1 className="font-display text-2xl font-medium text-slate-900">{title}</h1>
            <div className="memory-divider max-w-xs mx-auto mt-4 mb-5" />
            <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </GlassCard>

        {footer && (
          <p className="text-center text-sm text-slate-500 mt-6">
            {footer.label}{" "}
            <Link href={footer.href} className="text-coral-600 hover:text-coral-700 font-semibold transition-colors">
              {footer.linkLabel}
            </Link>
          </p>
        )}

        <p className="text-center text-xs text-slate-400 mt-5">
          Every conversation becomes memory. Every memory stays yours.
        </p>
      </div>
    </div>
  );
}
