"use client";

import { ArrowUpRight, Lock, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Choice card for the main navigation steps (home, grade, half-year, subject).
 * Dark surface, thin border, neutral icon; `current` marks the one in use with
 * the accent colour.
 */
export function BigTile({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  current = false,
  locked = false,
  delay = 0,
  size = "lg",
  className,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  current?: boolean;
  locked?: boolean;
  /** Entrance delay in ms (for staggering a grid). */
  delay?: number;
  size?: "lg" | "md";
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border",
            size === "lg" ? "size-11" : "size-9 sm:size-10",
            current ? "border-transparent bg-primary text-primary-foreground" : "bg-white/[0.04] text-foreground",
          )}
        >
          {locked ? <Lock className="size-[18px]" strokeWidth={2} /> : <Icon className="size-5" strokeWidth={2} />}
        </span>
        {badge ??
          (!locked && href ? (
            <ArrowUpRight
              size={18}
              className="text-muted-foreground transition-[transform,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground rtl:-scale-x-100"
            />
          ) : null)}
      </div>
      <div className={cn("mt-auto", size === "lg" ? "pt-10 sm:pt-14" : "pt-5 sm:pt-8")}>
        <h2 className={cn("font-display font-bold leading-tight", size === "lg" ? "text-xl sm:text-2xl" : "text-base sm:text-lg")}>
          {title}
        </h2>
        {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
      </div>
    </>
  );

  const classes = cn(
    "tile enter group flex flex-col rounded-3xl border bg-card",
    size === "lg" ? "p-5 sm:p-6" : "rounded-2xl p-4 sm:rounded-3xl sm:p-5",
    locked && "pointer-events-none opacity-50",
    className,
  );
  const style = { animationDelay: `${delay}ms` } as React.CSSProperties;

  if (!href || locked) {
    return (
      <div className={classes} style={style} aria-disabled={locked || undefined}>
        {body}
      </div>
    );
  }
  return (
    <Link href={href} className={classes} style={style}>
      {body}
    </Link>
  );
}

/** Small label for a card's top-right corner, e.g. "Now". */
export function TileBadge({ children, dot = false }: { children: React.ReactNode; dot?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      {dot && <span className="size-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
}
