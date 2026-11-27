"use client";

import { BookOpen, CalendarCheck, HeartHandshake, House, Settings, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidingIndicator } from "@/components/sliding-indicator";
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

/** The six places in the app, in the sidebar and the bottom tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "home", icon: House, match: ["/home"] },
  { href: semesterHref(), label: "subjects", icon: BookOpen, match: ["/grade", "/library", "/practice"] },
  { href: "/communities", label: "communities", icon: Users, match: ["/communities", "/compare"] },
  { href: "/friends", label: "friends", icon: HeartHandshake, match: ["/friends", "/profile"] },
  { href: "/grades", label: "exams", icon: CalendarCheck, match: ["/grades", "/exams"] },
  { href: "/settings", label: "settings", icon: Settings, match: ["/settings", "/admin"] },
];

export function useActiveNav() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return (item: NavItem) => item.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** App mark: accent square with an open book. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]",
        className,
      )}
    >
      <BookOpen size={18} strokeWidth={2.25} />
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/home" className="flex items-center gap-2.5 font-display text-lg font-semibold">
      <LogoMark className="size-8" />
      <span>Study Hub</span>
    </Link>
  );
}

/** Fixed tab bar at the bottom on phones and iPads in portrait. */
export function BottomNav() {
  const { dict } = useI18n();
  const isActive = useActiveNav();
  const activeIndex = NAV_ITEMS.findIndex(isActive);
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="relative mx-auto flex max-w-2xl">
        <SlidingIndicator
          count={NAV_ITEMS.length}
          index={activeIndex}
          className="inset-x-0 top-2 mx-auto h-8 w-12 rounded-lg bg-secondary md:top-2.5"
        />
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.label} className="min-w-0 flex-1 basis-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press relative flex flex-col items-center gap-1 pb-2 pt-2 text-xs font-semibold md:pt-2.5 md:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className={cn("flex h-8 w-12 items-center justify-center rounded-lg", active && "text-[var(--c-amber)]")}>
                  <Icon className="size-5" strokeWidth={2.1} />
                </span>
                <span className="max-w-full truncate text-[11px] tracking-tighter min-[390px]:tracking-tight">{dict.nav[item.label]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
