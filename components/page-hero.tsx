"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTitle } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Big page header: optional back pill, small eyebrow line, huge title, subtitle. */
export function PageHero({
  back,
  eyebrow,
  title,
  subtitle,
  aside,
  className,
}: {
  back?: { href: string; label: string };
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  useTitle(title);
  return (
    <header
      className={cn(
        "enter",
        className,
      )}
    >
      {back && <BackPill href={back.href} label={back.label} />}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
        </div>
        {aside}
      </div>
    </header>
  );
}

export function BackPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3.5 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
    >
      <ArrowLeft size={16} className="rtl:rotate-180" />
      {label}
    </Link>
  );
}
