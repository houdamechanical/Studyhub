"use client";

import { ArrowUpRight, BookOpen, ChevronRight, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { BookRow } from "@/components/auth/book-row";
import { CommunityAvatar } from "@/components/communities/avatar";
import { CalendarDialog, MiniCalendar } from "@/components/exams/exam-calendar";
import { NewsArt } from "@/components/news";
import { SubjectIcon } from "@/components/subject-icon";
import { UserAvatar } from "@/components/user-avatar";
import { loadMyCommunities, type Community } from "@/lib/communities";
import { useLoad } from "@/lib/data";
import { formatPeriods, type SchoolExam } from "@/lib/exams";
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
  const [book, communities, friends] = await Promise.all([
    loadGradeBook(subjects, CURRENT_SEMESTER),
    loadMyCommunities().then((r) => r.list),
    loadFriendRows(CURRENT_SEMESTER).then((r) => r.list, () => [] as FriendRow[]),
  ]);
  const exams = book.exams;
  const nc = ncFromResults(subjectResults(subjects, exams, book.examGrades, book.oral));
  const today = todayISO();
  return { exams, next: exams.find((e) => e.exam_date >= today) ?? null, nc, communities, friends };
}

/** Home: a scene with your next exam, news, friends and NC – then the calendar and your groups. */
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
        <div className="flex flex-col gap-4">
          <Hero next={data.next} nc={data.nc} friends={data.friends} />
          <div className="grid gap-4 md:grid-cols-2">
            <MiniCalendar exams={data.exams} onOpen={() => setCalendar(true)} />
            <CommunitiesCard list={data.communities} />
          </div>
        </div>
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
function Hero({ next, nc, friends }: { next: SchoolExam | null; nc: ReturnType<typeof ncFromResults>; friends: FriendRow[] }) {
  const { locale, dict } = useI18n();
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
      <BookRow className="absolute inset-x-0 bottom-0 top-[42%] -z-10 opacity-90 md:inset-y-0 md:start-[44%] md:top-[30%] lg:start-[30%] lg:top-0" />
      {/* Darken behind the text, and fade the floor */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(14_12_10/0.92)_0%,rgb(14_12_10/0.55)_45%,transparent_75%)] max-md:bg-[linear-gradient(180deg,rgb(14_12_10/0.9)_0%,rgb(14_12_10/0.5)_55%,rgb(14_12_10/0.85)_100%)]" />

      <div className="relative grid gap-8 p-6 sm:p-8 md:min-h-[600px] md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] md:p-10 lg:p-12">
        {/* Left: greeting + next exam */}
        <div className="flex flex-col">
          <p className="hero-in text-sm font-medium text-white/70 [--d:0ms]">{fill(t.hello, { name: nickname })}</p>
          {next ? (
            <>
              <p className="hero-in mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/70 [--d:80ms]">
                <span className="size-2 rounded-full bg-[var(--hero-acc)]" aria-hidden />
                {t.nextExam}
              </p>
              <h1 className="hero-in mt-3 font-display font-semibold leading-[0.98] tracking-tight [--d:140ms]" style={{ fontSize: "clamp(2.6rem, 6.4vw, 4.6rem)" }}>
                <span className="flex items-center gap-3">
                  <SubjectIcon subject={next.subject} className="size-[0.8em] shrink-0 text-[var(--hero-acc)]" strokeWidth={2} />
                  <span className="truncate">{SUBJECTS[next.subject].label[locale]}</span>
                </span>
                <span className="block text-[var(--hero-acc)]">{when(next.exam_date, dict)}</span>
              </h1>
              <p className="hero-in mt-4 flex flex-wrap gap-x-4 gap-y-1 text-white/75 [--d:200ms]">
                <span>{formatDate(next.exam_date, locale, { weekday: "long", day: "numeric", month: "long" })}</span>
                {next.periods && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} aria-hidden />
                    {fill(dict.exams.lessons, { p: formatPeriods(next.periods) })}
                  </span>
                )}
                {next.title && <span>{next.title}</span>}
              </p>
            </>
          ) : (
            <h1 className="hero-in mt-6 font-display text-4xl font-semibold [--d:80ms]">{t.noExam}</h1>
          )}
          <div className="hero-in mt-7 flex flex-wrap items-center gap-3 [--d:260ms]">
            <Link
              href="/grades?tab=exams"
              className="press group flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-2 pe-2 ps-5 font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {t.allExams}
              <span className="flex size-9 items-center justify-center rounded-full border border-white/25 transition-transform group-hover:rotate-45">
                <ArrowUpRight size={17} />
              </span>
            </Link>
          </div>
        </div>

        {/* Right: what's new */}
        <NewsCarousel />

        {/* Bottom row: friends · study ring · NC */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:col-span-2 md:self-end">
          <FriendsStack friends={friends} />
          <StudyRing />
          <NcPill nc={nc} />
        </div>
      </div>
    </section>
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
          <NewsArt item={n} className="h-36 rounded-xl sm:h-40" />
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
        <p className="line-clamp-3 text-sm text-white/70 xl:flex-1">{n.text[locale]}</p>
      </div>
      <div className="flex items-center justify-between px-1">
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
        <Link href="/neu" className="flex items-center gap-0.5 text-sm font-semibold text-white/80 hover:text-white">
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
      <span className="text-sm font-medium text-white/80 group-hover:text-white">
        {friends.length === 0 ? t.noFriends : friends.length === 1 ? t.oneFriend : fill(t.friends, { n: friends.length })}
      </span>
    </Link>
  );
}

/** The rotating "Jetzt lernen" ring from the reference, leading to the subjects. */
function StudyRing() {
  const { dict } = useI18n();
  const text = dict.home2.ring.repeat(2);
  return (
    <Link href={semesterHref()} aria-label={dict.home2.study} className="hero-in group relative size-28 shrink-0 [--d:440ms] max-md:order-last max-md:mx-auto md:size-32">
      <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 size-full" aria-hidden>
        <defs>
          <path id="ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="rgb(0 0 0 / 0.35)" stroke="rgb(255 255 255 / 0.2)" />
        <text fill="white" style={{ font: "600 10.5px Inter, sans-serif", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <textPath href="#ring">{text}</textPath>
        </text>
      </svg>
      <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-[var(--hero-acc)] text-[#0e0c0a] transition-transform group-hover:scale-110">
        <BookOpen size={20} strokeWidth={2.2} />
      </span>
    </Link>
  );
}

function NcPill({ nc }: { nc: ReturnType<typeof ncFromResults> }) {
  const { locale, dict } = useI18n();
  const t = dict.home2;
  return (
    <Link
      href="/grades"
      className="hero-in group flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pe-1.5 ps-4 backdrop-blur-md transition-colors hover:bg-white/20 [--d:500ms]"
    >
      <span className="text-sm font-medium text-white/75">{t.nc}</span>
      <span className="font-display text-xl font-semibold tabular-nums">{nc ? formatNC(nc.nc, intlLocale(locale)) : "–"}</span>
      {!nc && <span className="text-sm text-white/70">{t.ncEmpty}</span>}
      <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:rotate-45">
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

function CommunitiesCard({ list }: { list: Community[] }) {
  const { dict } = useI18n();
  const t = dict.communities;
  return (
    <section className="enter flex flex-col rounded-xl border bg-card shadow-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="text-sm font-medium text-muted-foreground">{t.title}</h2>
        <Link href="/communities" className="hit flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
          {list.length ? t.title : t.create}
          <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </header>
      {list.length === 0 ? (
        <Link href="/communities" className="flex flex-1 items-center gap-3 px-4 py-6 text-sm text-muted-foreground hover:text-foreground">
          <Users size={16} aria-hidden />
          {t.empty}
        </Link>
      ) : (
        <ul>
          {list.slice(0, 6).map((c) => (
            <li key={c.id} className="border-b last:border-b-0">
              <Link href={`/communities/view?id=${c.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/60">
                <CommunityAvatar name={c.name} className="size-7 text-xs" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="auto">
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground">{c.members === 1 ? t.oneMember : fill(t.members, { n: c.members })}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-[600px] animate-pulse rounded-[28px] bg-[#1a1714]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border bg-card shadow-card" />
        <div className="h-64 animate-pulse rounded-xl border bg-card shadow-card" />
      </div>
    </div>
  );
}
