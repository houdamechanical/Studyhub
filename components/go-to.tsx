"use client";

import {
  BookOpen,
  CalendarCheck,
  Calculator,
  CircleUserRound,
  HeartHandshake,
  Settings,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useNewsUnseen } from "@/lib/news";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { semesterHref } from "@/lib/school";
import { cn } from "@/lib/utils";

type Place = { id: string; href: string; icon: LucideIcon; label: (d: Dictionary) => string };

/** Every place in the app, as tiles ("Gehe zu"). */
export const PLACES: Place[] = [
  { id: "subjects", href: semesterHref(), icon: BookOpen, label: (d) => d.nav.subjects },
  { id: "league", href: "/compare", icon: Trophy, label: (d) => d.nav.leaderboard },
  { id: "exams", href: "/grades?tab=exams", icon: CalendarCheck, label: (d) => d.home2.exams },
  { id: "grades", href: "/grades", icon: Calculator, label: (d) => d.home2.grades },
  { id: "friends", href: "/friends", icon: HeartHandshake, label: (d) => d.nav.friends },
  { id: "groups", href: "/communities", icon: Users, label: (d) => d.nav.communities },
  { id: "news", href: "/neu", icon: Sparkles, label: (d) => d.home2.news },
  { id: "profile", href: "/profile", icon: CircleUserRound, label: (d) => d.home2.profile },
  { id: "settings", href: "/settings", icon: Settings, label: (d) => d.nav.settings },
];

/** A ledger-style label above a group: monospace, spaced out. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("label-mono mb-3", className)}>{children}</p>;
}

/** Grid of square-ish tiles with an icon over the name. */
export function GoToGrid({ only, className, onPick }: { only?: string[]; className?: string; onPick?: () => void }) {
  const { dict } = useI18n();
  const unseen = useNewsUnseen();
  const places = only ? PLACES.filter((p) => only.includes(p.id)) : PLACES;
  return (
    <ul className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", className)}>
      {places.map((p) => {
        const Icon = p.icon;
        return (
          <li key={p.id}>
            <Link
              href={p.href}
              onClick={onPick}
              className="tile press relative flex h-[5.75rem] flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center sm:h-24"
            >
              <Icon size={22} strokeWidth={1.8} aria-hidden />
              <span className="line-clamp-2 max-w-full text-sm font-semibold leading-tight sm:text-[0.95rem]">{p.label(dict)}</span>
              {p.id === "news" && unseen && <span className="absolute end-3 top-3 size-2 rounded-full bg-[var(--c-amber)]" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
