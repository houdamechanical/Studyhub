"use client";

import { ArrowUpRight, CalendarDays, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { BookRow } from "@/components/auth/book-row";
import { CalendarDialog } from "@/components/exams/exam-calendar";
import { NewsArt } from "@/components/news";
import { SubjectIcon } from "@/components/subject-icon";
import { UserAvatar } from "@/components/user-avatar";
import { useLoad } from "@/lib/data";
import type { SchoolExam } from "@/lib/exams";
import { formatDate, intlLocale, todayISO } from "@/lib/format";
import { loadFriendRows, type FriendRow } from "@/lib/friends";
import { loadGradeBook, ncFromResults, subjectResults } from "@/lib/gradebook";
import { CURRENT_SEMESTER, formatNC } from "@/lib/grades";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill, type Dictionary } from "@/lib/i18n/dictionaries";
import { daysUntil } from "@/lib/loaders";
import { NEWS } from "@/lib/news";
import { usePeople } from "@/lib/people";
import { semesterHref } from "@/lib/school";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

async function loadHome(subjects: SubjectId[]) {
  const [book, friends] = await Promise.all([
    loadGradeBook(subjects, CURRENT_SEMESTER),
    loadFriendRows(CURRENT_SEMESTER).then((r) => r.list, () => [] as FriendRow[]),
  ]);
  const exams = book.exams;
  const nc = ncFromResults(subjectResults(subjects, exams, book.examGrades, book.oral));
  const today = todayISO();
  return { exams, next: exams.find((e) => e.exam_date >= today) ?? null, nc, friends };
}

/** Home: one dark scene – news, friends, the next exam (→ calendar) and your NC (→ grades). Everything else is in the bar above. */
export default function HomePage() {
  const { subjects } = useAuth();
  const { dict } = useI18n();
  useTitle(dict.nav.home);
  const { data } = useLoad(() => loadHome(subjects), `home:${subjects.join(",")}`);
  const [calendar, setCalendar] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:pt-6 lg:px-6">
      {!data ? (
        <HomeSkeleton />
      ) : (
        <Hero friends={data.friends} next={data.next} nc={data.nc} onCalendar={() => setCalendar(true)} />
      )}
      {calendar && data && <CalendarDialog exams={data.exams} onClose={() => setCalendar(false)} />}
    </div>
  );
}

function when(date: string, dict: Dictionary) {
  const days = daysUntil(date);
  return days <= 0 ? dict.exams.today : days === 1 ? dict.exams.tomorrow : fill(dict.exams.inDays, { n: days });
}

/**
 * The scene: a dark card with the 3D book row as its "photo". Text is always
 * light here (in both themes), the accent is a lighter royal blue at day and
 * orange at night.
 */
function Hero({
  friends,
  next,
  nc,
  onCalendar,
}: {
  friends: FriendRow[];
  next: SchoolExam | null;
  nc: ReturnType<typeof ncFromResults>;
  onCalendar: () => void;
}) {
  const { dict } = useI18n();
  const { nickname } = useAuth();
  const t = dict.home2;
  return (
    <section
      className="hero-scene enter relative isolate overflow-hidden rounded-[28px] text-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)]"
      style={{
        background:
          "radial-gradient(120% 90% at 88% 0%, #3d2b1b 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, #18263b 0%, transparent 60%), #0e0c0a",
      }}
    >
      {/* The "photo": warm-lit books that rise near the pointer */}
      <BookRow className="absolute inset-x-0 bottom-0 top-[55%] -z-10 opacity-80 md:inset-y-0 md:start-[40%] md:top-[38%] lg:start-[30%] lg:top-[10%]" />
      {/* Darken behind the text, and fade the floor */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(14_12_10/0.92)_0%,rgb(14_12_10/0.55)_45%,transparent_75%)] max-md:bg-[linear-gradient(180deg,rgb(14_12_10/0.9)_0%,rgb(14_12_10/0.55)_60%,rgb(14_12_10/0.9)_100%)]" />

      <div className="relative grid gap-7 p-5 sm:p-8 md:min-h-[max(560px,calc(100dvh-8.5rem))] md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:p-10">
        <div className="flex flex-col">
          <p className="hero-in label-mono !text-white/60 [--d:0ms]">{fill(t.hello, { name: nickname })}</p>
          <h1 className="hero-in mt-4 max-w-[12ch] font-display font-semibold leading-[1.02] tracking-tight [--d:80ms]" style={{ fontSize: "clamp(2.1rem, 5.2vw, 3.6rem)" }}>
            {t.heroTitle}
          </h1>
          <p className="hero-in mt-3 max-w-[34ch] text-white/70 [--d:140ms]">{t.heroText}</p>
          <div className="hero-in mt-6 flex flex-wrap items-center gap-3 [--d:200ms]">
            <Link
              href={semesterHref()}
              className="press group flex h-12 items-center gap-3 rounded-2xl bg-[var(--hero-acc)] pe-2 ps-5 font-bold text-[#0e0c0a]"
            >
              {t.study}
              <span className="flex size-8 items-center justify-center rounded-xl bg-black/10 transition-transform group-hover:rotate-45">
                <ArrowUpRight size={17} />
              </span>
            </Link>
          </div>
        </div>

        {/* Right: what's new */}
        <NewsCarousel />

        {/* Bottom row: friends · next exam · NC */}
        <div className="flex flex-col gap-5 md:col-span-2 md:flex-row md:items-end md:justify-between md:self-end">
          <FriendsStack friends={friends} />
          <div className="hero-in grid grid-cols-2 gap-2.5 [--d:420ms] max-[379px]:grid-cols-1 md:w-[27rem]">
            <ExamTile next={next} onOpen={onCalendar} />
            <NcTile nc={nc} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small box: the next exam. Opens the whole calendar. */
function ExamTile({ next, onOpen }: { next: SchoolExam | null; onOpen: () => void }) {
  const { locale, dict } = useI18n();
  return (
    <button type="button" onClick={onOpen} className="press group flex min-h-[7.5rem] flex-col rounded-2xl border border-white/15 bg-[#1b1814]/85 p-4 text-start text-white backdrop-blur-xl transition-colors hover:bg-[#26221c]/90">
      <span className="flex w-full items-start justify-between gap-2">
        <span className="label-mono !text-white/60">{dict.home2.examTile}</span>
        <CalendarDays size={17} className="shrink-0 text-white/60 transition-colors group-hover:text-white" aria-label={dict.home2.calendar} />
      </span>
      {next ? (
        <>
          <span className="mt-auto flex items-center gap-2 pt-3 font-display text-xl font-semibold leading-tight">
            <SubjectIcon subject={next.subject} className="size-5 shrink-0 text-[var(--hero-acc)]" strokeWidth={2} />
            <span className="truncate">{SUBJECTS[next.subject].label[locale]}</span>
          </span>
          <span className="mt-1 truncate text-sm">
            <span className="font-semibold text-[var(--hero-acc)]">{when(next.exam_date, dict)}</span>
            <span className="text-white/60 max-[380px]:hidden"> · </span>
            <span className="text-white/60 max-[380px]:hidden">{formatDate(next.exam_date, locale, { day: "numeric", month: "short" })}</span>
          </span>
        </>
      ) : (
        <span className="mt-auto pt-3 text-sm font-medium text-white/70">{dict.home2.noExam}</span>
      )}
    </button>
  );
}

/** Small box: your NC. Leads to the grades. */
function NcTile({ nc }: { nc: ReturnType<typeof ncFromResults> }) {
  const { locale, dict } = useI18n();
  const t = dict.home2;
  return (
    <Link href="/grades" className="press group flex min-h-[7.5rem] flex-col rounded-2xl border border-white/15 bg-[#1b1814]/85 p-4 text-start text-white backdrop-blur-xl transition-colors hover:bg-[#26221c]/90">
      <span className="flex items-start justify-between gap-2">
        <span className="label-mono !text-white/60">{t.ncTile}</span>
        <ArrowUpRight size={17} className="shrink-0 text-white/60 transition-transform group-hover:rotate-45 group-hover:text-white" />
      </span>
      <span className="mt-auto pt-3 font-display text-4xl font-semibold leading-none tabular-nums tracking-tight">
        {nc ? formatNC(nc.nc, intlLocale(locale)) : "–"}
      </span>
      <span className="mt-1.5 truncate text-sm text-white/60">{nc ? fill(t.ncOf, { n: nc.subjects }) : t.ncEmpty}</span>
    </Link>
  );
}

/** Cycles through "What's new" like the photo card in a travel site. */
function NewsCarousel() {
  const { locale, dict } = useI18n();
  const items = NEWS.slice(0, 7);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [paused, items.length]);
  const n = items[i];
  const pad = (x: number) => String(x).padStart(2, "0");
  return (
    <div className="hero-in flex flex-col gap-3 [--d:320ms] md:self-start" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Link href={n.href ?? "/neu"} className="group overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1.5 backdrop-blur-md transition-colors hover:bg-white/15" aria-label={n.title[locale]}>
        <div key={n.id} className="fade-swap relative">
          <NewsArt item={n} className="h-24 rounded-xl sm:h-36" />
          <span className="absolute end-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">{dict.news.newBadge}</span>
        </div>
        <div className="flex items-center gap-3 px-2 pb-1.5 pt-2.5">
          <span className="text-xs font-semibold tabular-nums text-white/80">
            {pad(i + 1)}/{pad(items.length)}
          </span>
          <span className="flex flex-1 gap-1" aria-hidden>
            {items.map((x, k) => (
              <span key={x.id} className={cn("h-1 flex-1 rounded-full transition-colors", k === i ? "bg-white" : "bg-white/25")} />
            ))}
          </span>
        </div>
      </Link>
      <div key={n.id + "-t"} className="fade-swap flex flex-col gap-1 px-1 xl:flex-row xl:gap-4">
        <p className="font-display text-xl font-semibold leading-tight xl:max-w-[9rem]">{n.title[locale]}</p>
        <p className="line-clamp-2 text-sm text-white/70 max-md:hidden xl:flex-1">{n.text[locale]}</p>
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex gap-1" role="tablist" aria-label={dict.news.title}>
          {items.map((x, k) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={x.title[locale]}
              onClick={() => setI(k)}
              className={cn("size-2.5 rounded-full transition-colors", k === i ? "bg-white" : "bg-white/30 hover:bg-white/60")}
            />
          ))}
        </div>
        <Link href="/neu" className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm font-semibold text-white/80 hover:text-white">
          {dict.news.all}
          <ChevronRight size={15} className="rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function FriendsStack({ friends }: { friends: FriendRow[] }) {
  const { dict } = useI18n();
  const t = dict.home2;
  const shown = friends.slice(0, 4);
  const people = usePeople(shown.map((f) => f.user_id));
  return (
    <Link href="/friends" className="hero-in group flex items-center gap-3 [--d:380ms]">
      {shown.length ? (
        <span className="flex -space-x-3 rtl:space-x-reverse">
          {shown.map((f) => (
            <UserAvatar key={f.user_id} userId={f.user_id} avatar={people.get(f.user_id)?.avatar} name={f.nickname} className="size-11 text-base ring-2 ring-[#0e0c0a]" still />
          ))}
        </span>
      ) : (
        <span className="flex size-11 items-center justify-center rounded-full border border-dashed border-white/40">
          <Users size={18} />
        </span>
      )}
      <span className="whitespace-nowrap text-sm font-medium text-white/80 group-hover:text-white">
        {friends.length === 0 ? t.noFriends : friends.length === 1 ? t.oneFriend : fill(t.friends, { n: friends.length })}
      </span>
    </Link>
  );
}


function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-[560px] animate-pulse rounded-[28px] bg-[#1a1714]" />
    </div>
  );
}
