"use client";

import { House, PencilLine, Sparkles, UserRound, Users } from "lucide-react";
import { SubjectIcon } from "@/components/subject-icon";
import { BOOK_THEME } from "@/components/subject-book";
import type { NewsItem } from "@/lib/news";
import { isSubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const FEATURE: Record<string, { from: string; to: string; icon: typeof House }> = {
  home: { from: "#ff9a5a", to: "#c2410c", icon: House },
  pad: { from: "#6f8dff", to: "#2350d8", icon: PencilLine },
  profile: { from: "#c19bff", to: "#6741d9", icon: UserRound },
  friends: { from: "#5fd3ac", to: "#0d7a5c", icon: Users },
};

/** The picture of a news entry: a book-cover gradient with its icon and a dotted texture. */
export function NewsArt({ item, className }: { item: NewsItem; className?: string }) {
  const subject = isSubjectId(item.art) ? item.art : null;
  const f = subject ? null : (FEATURE[item.art] ?? { from: "#ff9a5a", to: "#c2410c", icon: Sparkles });
  const from = subject ? BOOK_THEME[subject].from : f!.from;
  const to = subject ? BOOK_THEME[subject].to : f!.to;
  const Icon = f?.icon;
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.22) 1px, transparent 1.4px) 0 0 / 12px 12px, linear-gradient(140deg, ${from}, ${to})`,
      }}
    >
      <div className="absolute -bottom-6 -end-4 opacity-25">
        {subject ? <SubjectIcon subject={subject} className="size-32 text-white" strokeWidth={1.5} /> : Icon && <Icon className="size-32 text-white" strokeWidth={1.5} />}
      </div>
      <div className="absolute start-4 top-4 flex size-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
        {subject ? <SubjectIcon subject={subject} className="size-6" strokeWidth={2} /> : Icon && <Icon className="size-6" strokeWidth={2} />}
      </div>
    </div>
  );
}
