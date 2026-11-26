"use client";

import { ArrowUpRight, Lock, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Big colourful gradient tile used for the main choices (home, grade and
 * half-year pickers, subjects). White text sits on the gradient.
 */
export function BigTile({
  href,
  background,
  icon: Icon,
  emoji,
  title,
  subtitle,
  badge,
  locked = false,
  animate = false,
  delay = 0,
  size = "lg",
  className,
}: {
  href?: string;
  /** CSS background (a gradient). */
  background: string;
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  locked?: boolean;
  /** Slowly pan the gradient. */
  animate?: boolean;
  /** Entrance animation delay in ms (for staggering a grid). */
  delay?: number;
  size?: "lg" | "md";
  className?: string;
}) {
  const body = (
    <>
      {/* gradient on its own layer, so its pan animation doesn't clash with the entrance one */}
      <span
        className={cn("absolute inset-0 -z-20", animate && "animate-gradient-pan bg-[length:200%_200%]")}
        style={{ backgroundImage: background }}
        aria-hidden
      />
      {/* texture + sheen */}
      <span className="tile-dots absolute inset-0 -z-10 opacity-60" aria-hidden />
      {/* big faded decoration in the corner */}
      <span
        className={cn(
          "pointer-events-none absolute -z-10 select-none opacity-[0.18] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110",
          size === "lg" ? "-bottom-6 -end-6 rotate-[-14deg]" : "-bottom-4 -end-4 rotate-[-14deg]",
        )}
        aria-hidden
      >
        {emoji ? (
          <span className={size === "lg" ? "text-[9rem] leading-none" : "text-[6.5rem] leading-none"}>{emoji}</span>
        ) : Icon ? (
          <Icon className={size === "lg" ? "size-44" : "size-32"} strokeWidth={1.5} />
        ) : null}
      </span>

      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "glass flex shrink-0 items-center justify-center rounded-2xl shadow-sm",
            size === "lg" ? "size-12 sm:size-14" : "size-11",
          )}
        >
          {locked ? (
            <Lock className="size-5 sm:size-6" strokeWidth={2.5} />
          ) : emoji ? (
            <span className={size === "lg" ? "text-2xl sm:text-3xl" : "text-2xl"}>{emoji}</span>
          ) : Icon ? (
            <Icon className="size-5 sm:size-6" strokeWidth={2.5} />
          ) : null}
        </span>
        {badge ??
          (!locked && href ? (
            <span className="glass flex size-9 items-center justify-center rounded-full opacity-80 transition-all group-hover:rotate-45 group-hover:opacity-100">
              <ArrowUpRight size={18} strokeWidth={2.5} className="rtl:-scale-x-100" />
            </span>
          ) : null)}
      </div>

      <div className="mt-auto pt-6">
        <h2
          className={cn(
            "font-display font-extrabold leading-[1.05] tracking-tight drop-shadow-sm",
            size === "lg" ? "text-[1.4rem] sm:text-4xl" : "text-lg sm:text-2xl",
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <div className={cn("mt-1 font-medium text-white/85", size === "lg" ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>
            {subtitle}
          </div>
        )}
      </div>
    </>
  );

  const classes = cn(
    "tile tile-sheen group flex flex-col rounded-4xl text-white shadow-lg",
    size === "lg" ? "min-h-44 p-5 sm:min-h-60 sm:p-7" : "min-h-40 p-4 sm:min-h-44 sm:p-5",
    locked && "cursor-not-allowed saturate-[0.6]",
    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:fill-mode-both motion-safe:duration-700",
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

/** Small frosted label for a tile's top-right corner. */
export function TileBadge({ children, pulse = false }: { children: React.ReactNode; pulse?: boolean }) {
  return (
    <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide">
      {pulse && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
      )}
      {children}
    </span>
  );
}
