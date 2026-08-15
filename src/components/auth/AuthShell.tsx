import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { GlassCard } from "@/components/shared/GlassCard";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: { label: string; linkLabel: string; href: string };
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background mesh-gradient">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <GlassCard className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-slate-400 mt-1.5">{subtitle}</p>
          </div>

          {children}
        </GlassCard>

        {footer && (
          <p className="text-center text-sm text-slate-400 mt-6">
            {footer.label}{" "}
            <Link href={footer.href} className="text-coral-400 hover:text-coral-300 font-medium transition-colors">
              {footer.linkLabel}
            </Link>
          </p>
        )}

        <p className="text-center text-xs text-slate-600 mt-4">
          Every conversation becomes memory. Every memory stays yours.
        </p>
      </div>
    </div>
  );
}
