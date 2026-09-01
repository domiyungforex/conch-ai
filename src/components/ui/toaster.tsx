"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn("fixed bottom-4 inset-x-4 z-[100] flex max-h-dvh flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-[380px]", className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "glass border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-2xl",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-4",
      variant === "destructive" && "border-red-500/20 bg-red-500/10",
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold text-white", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn("text-sm text-slate-400 mt-0.5", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn("text-slate-400 hover:text-white transition-colors ml-auto shrink-0 mt-0.5", className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

type ToastState = { id: string; title?: string; description?: string; variant?: "default" | "destructive" };
const toastStore = { items: [] as ToastState[], listeners: new Set<() => void>() };

export function toast(opts: Omit<ToastState, "id">) {
  const id = crypto.randomUUID();
  toastStore.items = [{ id, ...opts }, ...toastStore.items].slice(0, 5);
  toastStore.listeners.forEach((l) => l());
  setTimeout(() => {
    toastStore.items = toastStore.items.filter((t) => t.id !== id);
    toastStore.listeners.forEach((l) => l());
  }, 4000);
}

export function Toaster() {
  const [items, setItems] = React.useState<ToastState[]>([]);
  React.useEffect(() => {
    const update = () => setItems([...toastStore.items]);
    toastStore.listeners.add(update);
    return () => { toastStore.listeners.delete(update); };
  }, []);

  return (
    <ToastProvider>
      {items.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
