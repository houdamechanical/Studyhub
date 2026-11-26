"use client";

import { BookOpen, GraduationCap, House, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MeasuredIndicator, SlidingIndicator } from "@/components/sliding-indicator";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { semesterHref } from "@/lib/school";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: keyof Dictionary["nav"];
  icon: LucideIcon;
  /** Path prefixes that count as "inside" this tab. */
  match: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "home", icon: House, match: [] },
  { href: semesterHref(), label: "subjects", icon: BookOpen, match: ["/grade", "/library", "/practice"] },
  { href: "/grades", label: "gradesExams", icon: GraduationCap, match: ["/grades", "/exams"] },
  { href: "/compare", label: "leaderboard", icon: Trophy, match: ["/compare"] },
];

function useActive() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return (item: NavItem) =>
    item.href === "/" ? pathname === "/" : item.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Logo: gradient app mark + name. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-fuchsia-500/25">
        <BookOpen size={17} strokeWidth={2.5} />
      </span>
      <span className="hidden sm:inline">Study Hub</span>
    </Link>
  );
}

/**
 * Pills in the header, from the lg breakpoint up (laptops, iPad in landscape).
 * Below that – phones and iPads in portrait – the tab bar is used.
 */
export function DesktopNav() {
  const { dict } = useI18n();
  const isActive = useActive();
  const activeKey = NAV_ITEMS.find(isActive)?.label ?? null;
  return (
    <nav className="relative hidden lg:flex items-center gap-1 rounded-full bg-muted/70 p-1">
      <MeasuredIndicator activeKey={activeKey} className="rounded-full bg-primary shadow-md shadow-primary/30" />
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.label}
            data-key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={16} strokeWidth={2.25} />
            {dict.nav[item.label]}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed tab bar at the bottom on phones and iPads in portrait. */
export function BottomNav() {
  const { dict } = useI18n();
  const isActive = useActive();
  const activeIndex = NAV_ITEMS.findIndex(isActive);
  return (
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="relative mx-auto flex max-w-2xl">
        <SlidingIndicator
          count={NAV_ITEMS.length}
          index={activeIndex}
          className="inset-x-0 top-2 mx-auto h-8 w-14 rounded-full bg-primary shadow-md shadow-primary/30 md:top-2.5"
        />
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press relative flex flex-col items-center gap-1 pb-2 pt-2 text-[11px] font-semibold md:pt-2.5 md:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
                    active && "text-primary-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={2.25} />
                </span>
                <span className="max-w-full truncate px-1">{dict.nav[item.label]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
