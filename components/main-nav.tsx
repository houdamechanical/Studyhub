"use client";

import { BookOpen, CalendarCheck, HeartHandshake, House, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchButton } from "@/components/app-chrome";
import { useAuth } from "@/components/auth-gate";
import { SlidingIndicator } from "@/components/sliding-indicator";
import { UserAvatar } from "@/components/user-avatar";
import { useNewsUnseen } from "@/lib/news";
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

/** Fixed tab bar at the bottom on phones. */
export function BottomNav() {
  const { dict } = useI18n();
  const isActive = useActiveNav();
  const activeIndex = NAV_ITEMS.findIndex(isActive);
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
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

/**
 * iPad and computer: a floating bar at the top (instead of a sidebar).
 * Logo · sections · search, "What's new", your picture (→ profile), settings.
 */
export function TopNav() {
  const { dict } = useI18n();
  const isActive = useActiveNav();
  const { userId, nickname, avatar } = useAuth();
  const unseen = useNewsUnseen();
  const settings = NAV_ITEMS.find((i) => i.label === "settings")!;
  const links = NAV_ITEMS.filter((i) => i.label !== "settings");
  const pathname = usePathname().replace(/\/$/, "");
  return (
    <div className="no-print sticky top-0 z-40 hidden px-4 pt-3 md:block lg:px-6">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-2xl border bg-card/80 px-3 shadow-card backdrop-blur-xl"
      >
        <Link href="/home" className="press flex items-center gap-2.5 pe-2 font-display text-lg font-semibold">
          <LogoMark />
          <span className="hidden lg:inline">Study Hub</span>
        </Link>
        <ul className="mx-auto flex items-center gap-0.5">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon size={17} strokeWidth={2.1} className="shrink-0" />
                  <span className="hidden min-[900px]:inline">{dict.nav[item.label]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <SearchButton />
        <Link
          href="/neu"
          aria-label={dict.news.title}
          title={dict.news.title}
          aria-current={pathname === "/neu" ? "page" : undefined}
          className="press relative flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Sparkles size={18} strokeWidth={1.9} />
          {unseen && <span className="absolute end-2 top-2 size-2 rounded-full bg-[var(--c-amber)] ring-2 ring-card" />}
        </Link>
        <Link
          href={settings.href}
          aria-label={dict.nav.settings}
          title={dict.nav.settings}
          className={cn(
            "press flex size-10 items-center justify-center rounded-lg hover:bg-secondary hover:text-foreground",
            isActive(settings) ? "text-[var(--c-amber)]" : "text-muted-foreground",
          )}
        >
          <Settings size={18} strokeWidth={1.9} />
        </Link>
        <Link href="/profile" aria-label={dict.friends.myProfile} title={dict.friends.myProfile} className="press ms-1 rounded-full ring-2 ring-transparent transition-shadow hover:ring-[var(--c-border-strong)]">
          <UserAvatar userId={userId} avatar={avatar} name={nickname} className="size-10 text-base" />
        </Link>
      </nav>
    </div>
  );
}

/** Phones: "What's new" with a dot until the newest entry was opened. */
export function PhoneNewsButton({ className }: { className?: string }) {
  const { dict } = useI18n();
  const unseen = useNewsUnseen();
  return (
    <Link
      href="/neu"
      aria-label={dict.news.title}
      className={cn("press relative flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground", className)}
    >
      <Sparkles size={18} strokeWidth={1.9} />
      {unseen && <span className="absolute end-2 top-2 size-2 rounded-full bg-[var(--c-amber)] ring-2 ring-background" />}
    </Link>
  );
}
