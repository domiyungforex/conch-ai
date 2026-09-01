import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
  className?: string;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  // Modern lucide-react icons are React.forwardRef objects (typeof === "object"),
  // not plain functions. Accept both so the icon is called as <IconComponent />.
  if (typeof icon === "function") return true;
  if (typeof icon === "object" && icon !== null && "$$typeof" in icon) return true;
  return false;
}

function isActionObject(action: unknown): action is { label: string; onClick: () => void } {
  return typeof action === "object" && action !== null && "label" in action && "onClick" in action;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const IconComponent = isLucideIcon(icon) ? icon : null;
  const iconNode = !isLucideIcon(icon) ? icon : null;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {(IconComponent || iconNode) && (
        <div className="w-16 h-16 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4 text-coral-400">
          {IconComponent ? <IconComponent className="w-8 h-8" /> : iconNode}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">{description}</p>}
      {isActionObject(action) ? (
        <Button onClick={action.onClick}>{action.label}</Button>
      ) : (
        action
      )}
    </div>
  );
}
