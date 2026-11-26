import { ArrowLeft, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/compare/leaderboard";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { isUuid } from "@/lib/actions";
import { normaliseBoard, type Board } from "@/lib/compare";
import { fill } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.compare.leaderboard };
}

export default async function QuizBoardPage({ params }: Props) {
  const { id } = await params;
  if (!hasEnvVars) return <SetupNotice problem="no-env" />;
  if (!isUuid(id)) notFound();

  const { locale, dict } = await getI18n();
  const t = dict.compare;
  const supabase = await createClient();
  const [{ data: quiz }, { data: raw, error }] = await Promise.all([
    supabase.from("quizzes").select("id, kind, subject, title").eq("id", id).maybeSingle(),
    supabase.rpc("get_quiz_board", { p_quiz_id: id }),
  ]);
  if (!quiz) notFound();
  if (error) console.error("get_quiz_board", error);
  const board = normaliseBoard((raw ?? { participants: 0, average: null, mine: null, rows: [] }) as Board);
  const subject = SUBJECTS[quiz.subject as SubjectId];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <Link
        href={`/compare?subject=${quiz.subject}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t.backToCompare}
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.leaderboard} · {quiz.kind === "mock" ? dict.quiz.mock : dict.quiz.mini} · {subject.emoji} {subject.label[locale]}
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
        <Link href={`/practice/quiz/${quiz.id}`}>
          <Play size={16} />
          {dict.practice.start}
        </Link>
      </Button>
    </div>
  );
}
