"use client";

import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Leaderboard } from "@/components/compare/leaderboard";
import { Loaded, NotFoundMessage } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { isUuid } from "@/lib/actions";
import { normaliseBoard, type Board } from "@/lib/compare";
import { must, useLoad } from "@/lib/data";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

// /compare/quiz?id=…
export default function QuizBoardPage() {
  return (
    <Suspense>
      <QuizBoard />
    </Suspense>
  );
}

async function loadBoard(id: string) {
  if (!isUuid(id)) return null;
  const supabase = createClient();
  const [quiz, board] = await Promise.all([
    supabase.from("quizzes").select("id, kind, subject, title").eq("id", id).maybeSingle(),
    supabase.rpc("get_quiz_board", { p_quiz_id: id }),
  ]);
  const q = must(quiz) as { id: string; kind: string; subject: string; title: string } | null;
  if (!q) return null;
  return { quiz: q, board: normaliseBoard(must(board) as Board) };
}

function QuizBoard() {
  const id = useSearchParams().get("id") ?? "";
  const { locale, dict } = useI18n();
  const t = dict.compare;
  useTitle(t.leaderboard);
  const state = useLoad(() => loadBoard(id), `board:${id}`);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <Loaded state={state}>
        {(data) => {
          if (!data) return <NotFoundMessage />;
          const { quiz, board } = data;
          const subject = SUBJECTS[quiz.subject as SubjectId];
          return (
            <>
              <Link
                href={`/compare?subject=${quiz.subject}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} className="rtl:rotate-180" />
                {t.backToCompare}
              </Link>
              <header>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.leaderboard} · {quiz.kind === "mock" ? dict.quiz.mock : dict.quiz.mini} · {subject.emoji}{" "}
                  {subject.label[locale]}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight" dir="auto">
                  {quiz.title}
                </h1>
              </header>
              <Leaderboard
                board={board}
                format={(v) => `${Math.round(v * 100)} %`}
                extra={(n) => (n === 1 ? t.oneAttempt : fill(t.attemptsCount, { n }))}
                labels={{ you: t.you, average: t.average, people: t.people, empty: t.noResults }}
              />
              <Button asChild className="self-start">
                <Link href={`/practice/quiz?id=${quiz.id}`}>
                  <Play size={16} />
                  {dict.practice.start}
                </Link>
              </Button>
            </>
          );
        }}
      </Loaded>
    </div>
  );
}
