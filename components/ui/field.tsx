import { cn } from "@/lib/utils";

/** Shared look for native inputs, selects and textareas (no extra UI library). */
export const controlClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-base md:text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:text-red-400">
      {message}
    </p>
  );
}
