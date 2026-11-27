"use client";

import Link from "next/link";
import { SearchButton } from "@/components/app-chrome";
import { LogoMark, NAV_ITEMS, useActiveNav } from "@/components/main-nav";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Slim icon rail from the lg breakpoint up (computers, iPad in landscape):
 * the app mark, then the five sections. Labels show as tooltips.
 */
export function Sidebar() {
  const { dict } = useI18n();
  const isActive = useActiveNav();
  const main = NAV_ITEMS.slice(0, 4);
  const settings = NAV_ITEMS[4];

  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center border-e bg-[var(--c-side)] py-4 lg:flex">
      <Link href="/home" aria-label="Study Hub" className="press">
        <LogoMark />
      </Link>

      <SearchButton className="mt-5" />

      <nav className="mt-3 flex flex-1 flex-col items-center gap-1" aria-label="Main">
        {main.map((item) => (
          <RailLink key={item.label} href={item.href} label={dict.nav[item.label]} icon={item.icon} active={isActive(item)} />
        ))}
      </nav>

      <RailLink href={settings.href} label={dict.nav[settings.label]} icon={settings.icon} active={isActive(settings)} />
    </aside>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (typeof NAV_ITEMS)[number]["icon"];
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press group/rail relative flex size-10 items-center justify-center rounded-lg",
        active ? "bg-secondary text-[var(--c-amber)]" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
      )}
    >
      {active && <span className="absolute inset-y-2.5 -start-[12px] w-[3px] rounded-full bg-primary" aria-hidden />}
      <Icon className="size-[18px]" strokeWidth={1.9} />
      {/* Tooltip (hover intent: shows after a short pause) */}
      <span
        role="tooltip"
        className="pointer-events-none absolute start-full z-50 ms-3 whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover/rail:opacity-100 group-hover/rail:delay-300 group-focus-visible/rail:opacity-100"
      >
        {label}
      </span>
    </Link>
  );
}
