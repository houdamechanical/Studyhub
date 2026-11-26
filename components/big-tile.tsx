"use client";

import { ArrowUpRight, Lock, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { GlassIcon } from "@/components/subject-icon";
import { cn } from "@/lib/utils";

/**
 * Big gradient tile used for the main choices (home, grade and half-year
 * pickers, subjects). Mesh gradient + grain, glass icon chip, a large outline
 * of the same icon as decoration, white text.
 */
export function BigTile({
  href,
  background,
  icon,
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
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  locked?: boolean;
  /** Slowly pan the gradient (use on one tile at most). */
  animate?: boolean;
  /** Entrance delay in ms (for staggering a grid). */
  delay?: number;
  size?: "lg" | "md";
  className?: string;
}) {
  const Icon = icon;
  const body = (
    <>
      {/* gradient on its own layer, so its pan animation doesn't clash with the entrance */}
      <span
        className={cn("absolute inset-0 -z-20", animate && "animate-gradient-pan bg-[length:200%_200%]")}
        style={{ backgroundImage: background }}
        aria-hidden
      />
      <span className="grain-layer absolute inset-0 -z-10" aria-hidden />
      {/* big outline of the icon in the corner */}
      <Icon
        className={cn(
          "pointer-events-none absolute -z-10 text-white/[0.16] transition-transform duration-500 ease-out group-hover:-rotate-3 group-hover:scale-105",
          size === "lg" ? "-bottom-8 -end-6 size-44 rotate-[-12deg] sm:size-56" : "-bottom-6 -end-5 size-32 rotate-[-12deg]",
        )}
        strokeWidth={1.25}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-2">
        <GlassIcon icon={locked ? Lock : Icon} className={size === "lg" ? "size-12 sm:size-14" : "size-11"} />
        {badge ??
          (!locked && href ? (
            <span className="glass flex size-9 items-center justify-center rounded-full opacity-80 transition-[transform,opacity] duration-200 ease-out group-hover:opacity-100 group-hover:[transform:translate(2px,-2px)] rtl:group-hover:[transform:translate(-2px,-2px)]">
              <ArrowUpRight size={18} strokeWidth={2.5} className="rtl:-scale-x-100" />
            </span>
          ) : null)}
      </div>

      <div className="mt-auto pt-6">
        <h2
          className={cn(
            "font-display font-extrabold leading-[1.05] drop-shadow-sm",
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
    "tile tile-sheen enter group flex flex-col rounded-4xl text-white shadow-lg shadow-black/10",
    size === "lg" ? "min-h-44 p-5 sm:min-h-60 sm:p-7" : "min-h-40 p-4 sm:min-h-44 sm:p-5",
    locked && "cursor-not-allowed saturate-[0.6]",
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
export function TileBadge({ children, dot = false }: { children: React.ReactNode; dot?: boolean }) {
  return (
    <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide">
      {dot && <span className="size-2 rounded-full bg-white shadow-[0_0_8px_rgb(255_255_255/0.9)]" />}
      {children}
    </span>
  );
}
