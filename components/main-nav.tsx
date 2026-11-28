"use client";

import { BookOpen, CalendarCheck, HeartHandshake, House, Plus, Settings, Sparkles, Trophy, Users, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchButton } from "@/components/app-chrome";
import { useAuth } from "@/components/auth-gate";
import { Eyebrow, GoToGrid } from "@/components/go-to";
import { NextExamCard } from "@/components/next-exam-card";
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

/** The places in the top bar (iPad, computer). Phones use PHONE_TABS + the "Mehr" sheet. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "home", icon: House, match: ["/home"] },
  { href: semesterHref(), label: "subjects", icon: BookOpen, match: ["/grade", "/library", "/practice"] },
  { href: "/compare", label: "leaderboard", icon: Trophy, match: ["/compare"] },
  { href: "/communities", label: "communities", icon: Users, match: ["/communities"] },
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

/** Phones: Start · Fächer · [Mehr] · Klausuren · Gruppen · Freunde – Year League and the rest live in the "Mehr" sheet. */
const PHONE_TABS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  { href: "/grades?tab=exams", label: "exams", icon: CalendarCheck, match: ["/grades", "/exams"] },
  { href: "/communities", label: "communities", icon: Users, match: ["/communities"] },
  { href: "/friends", label: "friends", icon: HeartHandshake, match: ["/friends", "/profile"] },
];

export function BottomNav() {
  const { dict } = useI18n();
  const isActive = useActiveNav();
  const [more, setMore] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMore(false), [pathname]);
  const tab = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <li key={item.label} className="min-w-0 flex-1 basis-0">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "press flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] transition-colors",
            active ? "font-bold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
          <span className="max-w-full truncate max-[389px]:text-[10px] max-[389px]:tracking-tighter">{dict.nav[item.label]}</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <ul className="mx-auto flex max-w-lg items-end px-1">
          {PHONE_TABS.slice(0, 2).map(tab)}
          <li className="min-w-0 flex-1 basis-0">
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-expanded={more}
              aria-haspopup="dialog"
              className="press flex w-full flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-semibold text-foreground"
            >
              <span className="flex h-[22px] w-[3.25rem] items-center justify-center rounded-full bg-foreground shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
                <span className="h-[3px] w-7 rounded-full bg-[var(--c-amber)]" />
              </span>
              {dict.home2.more}
            </button>
          </li>
          {PHONE_TABS.slice(2).map(tab)}
        </ul>
      </nav>
      {more && <MoreSheet onClose={() => setMore(false)} />}
    </>
  );
}

/** The "Mehr" sheet: next exam, quick actions, every other place. */
function MoreSheet({ onClose }: { onClose: () => void }) {
  const { dict } = useI18n();
  const t = dict.home2;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:hidden" role="dialog" aria-modal="true" aria-labelledby="more-title">
      <button type="button" aria-hidden tabIndex={-1} onClick={onClose} className="dialog-backdrop absolute inset-0 bg-black/45" />
      <div className="sheet-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border-t bg-background px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl">
        <header className="mb-5 flex items-center justify-between">
          <h2 id="more-title" className="font-display text-[1.75rem] font-semibold tracking-tight">
            {t.more}
          </h2>
          <button type="button" onClick={onClose} aria-label={dict.quiz.close} className="press flex size-11 items-center justify-center rounded-xl bg-secondary text-foreground">
            <X size={20} />
          </button>
        </header>
        <NextExamCard onPick={onClose} />
        <Eyebrow className="mt-6">{t.quick}</Eyebrow>
        <div className="grid grid-cols-2 gap-2.5">
          <Link href={semesterHref()} onClick={onClose} className="tile press flex h-14 items-center gap-3 rounded-2xl px-4 font-semibold">
            <BookOpen size={20} strokeWidth={1.9} />
            {dict.nav.subjects}
          </Link>
          <Link
            href="/grades"
            onClick={onClose}
            className="press flex h-14 items-center gap-2 rounded-2xl bg-primary px-3.5 font-semibold leading-tight text-primary-foreground shadow-[0_10px_24px_-12px_var(--c-amber)]"
          >
            <Plus size={20} strokeWidth={2.2} className="shrink-0" />
            <span className="line-clamp-2">{t.gradesCta}</span>
          </Link>
        </div>
        <Eyebrow className="mt-6">{t.goTo}</Eyebrow>
        <GoToGrid only={["league", "grades", "news", "profile", "settings"]} onPick={onClose} />
      </div>
    </div>
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
