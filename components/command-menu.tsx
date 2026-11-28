"use client";

import {
  ArrowLeft,
  ChartNoAxesColumn,
  CornerDownLeft,
  FileText,
  Gamepad2,
  Globe,
  Hash,
  Layers,
  ListChecks,
  Moon,
  MousePointerClick,
  PencilLine,
  Search,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { CommunityAvatar } from "@/components/communities/avatar";
import { NAV_ITEMS } from "@/components/main-nav";
import { BOOK_COLORS } from "@/components/subject-book";
import { SubjectIcon } from "@/components/subject-icon";
import { loadMyCommunities, type Community } from "@/lib/communities";
import { getAllContent, type ContentKind } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { subjectHref } from "@/lib/school";
import { isSubjectId, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "studyhub:search";
/** Opens the search from anywhere (e.g. a header button). */
export const openSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

type Item = {
  id: string;
  group: string;
  label: string;
  /** small grey line under the label (subject · topic …) */
  meta?: string;
  /** extra words that should match (other languages, topic, kind) */
  keywords: string;
  icon: React.ReactNode;
  run: () => void;
};

type Practice = { id: string; title: string; subject: string; kind?: "mini" | "mock" };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const KIND_ICON: Record<ContentKind, LucideIcon> = { notes: FileText, quiz: Gamepad2, interactive: MousePointerClick, exercises: PencilLine, exam: Timer };

/** ⌘K / Ctrl+K or the search button: full-screen search over pages, subjects, topics, study pages, tests and communities. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  return open ? <SearchScreen onClose={() => setOpen(false)} /> : null;
}

function SearchScreen({ onClose }: { onClose: () => void }) {
  const { dict, locale } = useI18n();
  const t = dict.search;
  const router = useRouter();
  const { subjects } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [practice, setPractice] = useState<{ quizzes: Practice[]; decks: Practice[] }>({ quizzes: [], decks: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadMyCommunities().then((r) => setCommunities(r.list), () => {});
    const supabase = createClient();
    Promise.all([supabase.from("quizzes").select("id, title, subject, kind"), supabase.from("decks").select("id, title, subject")]).then(
      ([q, d]) => setPractice({ quizzes: (q.data ?? []) as Practice[], decks: (d.data ?? []) as Practice[] }),
      () => {},
    );
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const items = useMemo(() => {
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    const icon = (Icon: LucideIcon) => <Icon size={18} className="text-muted-foreground" aria-hidden />;
    const allNames = (s: SubjectId) => Object.values(SUBJECTS[s].label).join(" ");
    const subjectBadge = (s: SubjectId, Icon?: LucideIcon) => (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: BOOK_COLORS[s] }}>
        {Icon ? <Icon size={16} aria-hidden /> : <SubjectIcon subject={s} className="size-4" />}
      </span>
    );
    const mine = new Set<string>(subjects);
    const content = getAllContent().filter((c) => mine.has(c.subject));
    const topics = [...new Map(content.map((c) => [`${c.subject}|${c.topic}`, c])).values()];

    const all: Item[] = [
      ...NAV_ITEMS.map((n) => ({ id: `nav-${n.href}`, group: t.pages, label: dict.nav[n.label], keywords: "", icon: icon(n.icon), run: go(n.href) })),
      { id: "grades", group: t.pages, label: dict.grades.title, keywords: "noten nc", icon: icon(ChartNoAxesColumn), run: go("/grades") },
      { id: "public", group: t.pages, label: dict.communities.publicBoard, keywords: "leaderboard rangliste", icon: icon(Globe), run: go("/compare") },
      ...subjects.map((s) => ({
        id: `subject-${s}`,
        group: t.subjects,
        label: SUBJECTS[s].label[locale],
        keywords: allNames(s),
        icon: subjectBadge(s),
        run: go(subjectHref(s)),
      })),
      ...topics.map((c) => ({
        id: `topic-${c.subject}-${c.topic}`,
        group: t.topics,
        label: c.topic,
        meta: SUBJECTS[c.subject].label[locale],
        keywords: allNames(c.subject),
        icon: subjectBadge(c.subject, Hash),
        run: go(subjectHref(c.subject, c.semester)),
      })),
      ...content.map((c) => ({
        id: `page-${c.id}`,
        group: t.studyPages,
        label: c.title,
        meta: `${SUBJECTS[c.subject].label[locale]} · ${c.topic}`,
        keywords: `${allNames(c.subject)} ${c.topic} ${dict.kind[c.kind]} ${c.tags.join(" ")}`,
        icon: subjectBadge(c.subject, KIND_ICON[c.kind]),
        run: go(`/library/${c.subject}/${c.id}`),
      })),
      ...practice.quizzes
        .filter((q) => isSubjectId(q.subject) && mine.has(q.subject))
        .map((q) => {
          const s = q.subject as SubjectId;
          const label = q.kind === "mock" ? dict.subject.mockExams : dict.subject.miniTests;
          return {
            id: `quiz-${q.id}`,
            group: t.tests,
            label: q.title,
            meta: `${SUBJECTS[s].label[locale]} · ${label}`,
            keywords: `${allNames(s)} ${label} test quiz`,
            icon: subjectBadge(s, q.kind === "mock" ? Timer : ListChecks),
            run: go(`/practice/quiz?id=${q.id}`),
          };
        }),
      ...practice.decks
        .filter((d) => isSubjectId(d.subject) && mine.has(d.subject))
        .map((d) => {
          const s = d.subject as SubjectId;
          return {
            id: `deck-${d.id}`,
            group: t.tests,
            label: d.title,
            meta: `${SUBJECTS[s].label[locale]} · ${dict.subject.flashcards}`,
            keywords: `${allNames(s)} ${dict.subject.flashcards} karteikarten flashcards`,
            icon: subjectBadge(s, Layers),
            run: go(`/practice/deck?id=${d.id}`),
          };
        }),
      ...communities.map((c) => ({
        id: `community-${c.id}`,
        group: t.communities,
        label: c.name,
        keywords: "",
        icon: <CommunityAvatar name={c.name} className="size-8" />,
        run: go(`/communities/view?id=${c.id}`),
      })),
      resolvedTheme === "dark"
        ? { id: "light", group: t.actions, label: t.lightMode, keywords: "theme", icon: icon(Sun), run: () => (setTheme("light"), onClose()) }
        : { id: "dark", group: t.actions, label: t.darkMode, keywords: "theme", icon: icon(Moon), run: () => (setTheme("dark"), onClose()) },
    ];

    // Every word must appear somewhere (name, subject in any language, topic …): "bio enzym" finds Biology pages about enzymes.
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return all.filter((i) => i.group !== t.studyPages && i.group !== t.tests && i.group !== t.topics);
    return all.filter((i) => {
      const hay = norm(`${i.label} ${i.meta ?? ""} ${i.keywords}`);
      return words.every((w) => hay.includes(w));
    });
  }, [query, communities, practice, subjects, locale, dict, t, resolvedTheme, setTheme, router, onClose]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let lastGroup = "";
  return (
    <div className="search-in fixed inset-0 z-[70] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={t.open} onKeyDown={onKeyDown}>
      <div className="border-b bg-card/60">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="press flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft size={22} className="rtl:rotate-180" />
          </button>
          <Search size={22} className="hidden shrink-0 text-muted-foreground sm:block" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
            enterKeyHint="go"
            className="h-12 min-w-0 flex-1 bg-transparent text-xl font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground sm:text-2xl"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-secondary">
              {t.clear}
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} id="search-results" role="listbox" className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 pb-10 pt-3 sm:px-6">
          {!query && <p className="px-3 pb-2 pt-3 text-base text-muted-foreground">{t.hint}</p>}
          {items.length === 0 && <p className="px-3 py-16 text-center text-lg text-muted-foreground">{t.empty}</p>}
          {items.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {heading && <p className="px-3 pb-1.5 pt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{heading}</p>}
                <button
                  type="button"
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={item.run}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl px-3 py-3 text-start",
                    i === active ? "bg-secondary" : "hover:bg-secondary/60",
                  )}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-medium" dir="auto">
                      {item.label}
                    </span>
                    {item.meta && (
                      <span className="block truncate text-sm text-muted-foreground" dir="auto">
                        {item.meta}
                      </span>
                    )}
                  </span>
                  {i === active && <CornerDownLeft size={16} className="hidden text-muted-foreground sm:block" aria-hidden />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
