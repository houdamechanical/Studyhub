"use client";

import { BookOpen, ChartNoAxesColumn, LayoutDashboard, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAccount } from "@/components/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SubjectIcon } from "@/components/subject-icon";
import { CURRENT_SEMESTER } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { formatSemester } from "@/lib/i18n/dictionaries";
import { semesterHref, subjectHref } from "@/lib/school";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/**
 * Left sidebar from the lg breakpoint up (computers, iPad in landscape):
 * main sections, then the subjects of the current half-year.
 */
export function Sidebar() {
  const { locale, dict } = useI18n();
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const is = (prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const main: { href: string; label: string; icon: LucideIcon; active: boolean }[] = [
    { href: "/", label: dict.nav.home, icon: LayoutDashboard, active: pathname === "/" },
    { href: "/grades", label: dict.nav.gradesExams, icon: ChartNoAxesColumn, active: is(["/grades", "/exams"]) },
    { href: "/compare", label: dict.nav.leaderboard, icon: Trophy, active: is(["/compare"]) },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e bg-card/60 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen size={17} strokeWidth={2.25} />
        </span>
        <span className="font-display text-xl font-semibold">Study Hub</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {main.map((item) => (
            <li key={item.href}>
              <SideLink href={item.href} active={item.active}>
                <item.icon size={17} strokeWidth={2} />
                {item.label}
              </SideLink>
            </li>
          ))}
        </ul>

        <div>
          <Link
            href={semesterHref()}
            className="mb-1 flex items-baseline justify-between px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {dict.nav.subjects}
            <span className="normal-case tracking-normal">{formatSemester(CURRENT_SEMESTER, dict)}</span>
          </Link>
          <ul className="flex flex-col gap-0.5">
            {SUBJECT_IDS.map((id) => {
              const href = subjectHref(id);
              return (
                <li key={id}>
                  <SideLink href={href} active={pathname === href || pathname.endsWith(`/${id}`)}>
                    <SubjectIcon subject={id} className="size-[17px]" strokeWidth={2} />
                    {SUBJECTS[id].label[locale]}
                  </SideLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <LanguageSwitcher />
        <HeaderAccount />
      </div>
    </aside>
  );
}

function SideLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.94rem] transition-colors duration-200",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary" aria-hidden />}
      {children}
    </Link>
  );
}
