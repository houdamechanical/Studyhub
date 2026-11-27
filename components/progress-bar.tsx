import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)} aria-hidden>
      <div
        className="h-full rounded-full bg-[var(--c-sage)] transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}
