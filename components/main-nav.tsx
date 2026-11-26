"use client";

import { BookOpen, Brain, CalendarClock, GraduationCap, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: keyof Dictionary["nav"]; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/library", label: "library", icon: BookOpen },
  { href: "/exams", label: "exams", icon: CalendarClock },
  { href: "/grades", label: "grades", icon: GraduationCap },
  { href: "/practice", label: "practice", icon: Brain },
  { href: "/compare", label: "compare", icon: Trophy },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

/** Inline links in the header, shown from the md breakpoint up. */
export function DesktopNav() {
  const { dict } = useI18n();
  const isActive = useActive();
  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            isActive(href)
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon size={16} />
          {dict.nav[label]}
        </Link>
      ))}
    </nav>
  );
}

/** Fixed tab bar at the bottom on phones. */
export function BottomNav() {
  const { dict } = useI18n();
  const isActive = useActive();
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                isActive(href) ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              {dict.nav[label]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
