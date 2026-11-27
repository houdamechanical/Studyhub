"use client";

import { ChartNoAxesColumn, CornerDownLeft, Globe, Moon, Search, Sun, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-gate";
import { CommunityAvatar } from "@/components/communities/avatar";
import { NAV_ITEMS } from "@/components/main-nav";
import { SubjectIcon } from "@/components/subject-icon";
import { loadMyCommunities, type Community } from "@/lib/communities";
import { useI18n } from "@/lib/i18n/client";
import { subjectHref } from "@/lib/school";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "studyhub:search";
/** Opens the search from anywhere (e.g. a header button). */
export const openSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

type Item = { id: string; group: string; label: string; icon: React.ReactNode; run: () => void };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** ⌘K / Ctrl+K: jump to any page, subject or community, or switch theme. */
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

  return open ? <Palette onClose={() => setOpen(false)} /> : null;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { dict, locale } = useI18n();
  const t = dict.search;
  const router = useRouter();
  const { subjects } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadMyCommunities().then((r) => setCommunities(r.list), () => {});
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
    const icon = (Icon: LucideIcon) => <Icon size={16} className="text-muted-foreground" aria-hidden />;
    const all: Item[] = [
      ...NAV_ITEMS.map((n) => ({ id: `nav-${n.href}`, group: t.pages, label: dict.nav[n.label], icon: icon(n.icon), run: go(n.href) })),
      { id: "grades", group: t.pages, label: dict.grades.title, icon: icon(ChartNoAxesColumn), run: go("/grades") },
      { id: "public", group: t.pages, label: dict.communities.publicBoard, icon: icon(Globe), run: go("/compare") },
      ...subjects.map((s) => ({
        id: `subject-${s}`,
        group: t.subjects,
        label: SUBJECTS[s].label[locale],
        icon: <SubjectIcon subject={s} className="size-4 text-muted-foreground" />,
        run: go(subjectHref(s)),
      })),
      ...communities.map((c) => ({
        id: `community-${c.id}`,
        group: t.communities,
        label: c.name,
        icon: <CommunityAvatar name={c.name} className="size-5 rounded text-[10px]" />,
        run: go(`/communities/view?id=${c.id}`),
      })),
      resolvedTheme === "dark"
        ? { id: "light", group: t.actions, label: t.lightMode, icon: icon(Sun), run: () => (setTheme("light"), onClose()) }
        : { id: "dark", group: t.actions, label: t.darkMode, icon: icon(Moon), run: () => (setTheme("dark"), onClose()) },
    ];
    const q = norm(query.trim());
    return q ? all.filter((i) => norm(i.label).includes(q)) : all;
  }, [query, communities, subjects, locale, dict, t, resolvedTheme, setTheme, router, onClose]);

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
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t.open}>
      <button type="button" tabIndex={-1} aria-hidden onClick={onClose} className="dialog-backdrop absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="dialog-panel relative w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b px-4">
          <Search size={17} className="shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">Esc</kbd>
        </div>
        <div ref={listRef} id="command-list" role="listbox" className="max-h-[min(60vh,26rem)] overflow-y-auto p-1.5">
          {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t.empty}</p>}
          {items.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {heading && <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-muted-foreground">{heading}</p>}
                <button
                  type="button"
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={item.run}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm",
                    i === active ? "bg-secondary text-foreground" : "text-foreground/90",
                  )}
                >
                  {item.icon}
                  <span className="flex-1 truncate" dir="auto">
                    {item.label}
                  </span>
                  {i === active && <CornerDownLeft size={14} className="text-muted-foreground" aria-hidden />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="hidden items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
          <span>
            <kbd className="font-sans">↑↓</kbd> {t.navigate}
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> {t.select}
          </span>
          <span>
            <kbd className="font-sans">Esc</kbd> {t.close}
          </span>
        </div>
      </div>
    </div>
  );
}
