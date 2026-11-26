"use client";

import { SubjectIcon } from "@/components/subject-icon";
import { Check, Clock, MapPin, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { deleteExam, setExamStatus } from "@/lib/mutations/exams";
import { ExamForm } from "@/components/exams/exam-form";
import { NextExamCountdown } from "@/components/exams/next-exam-countdown";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { sortByDate, type Exam } from "@/lib/exams";
import { formatDate, formatTime, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECTS } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export function ExamsView({ exams }: { exams: Exam[] }) {
  const { dict } = useI18n();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const upcoming = sortByDate(exams.filter((e) => e.status === "upcoming"));
  const done = sortByDate(exams.filter((e) => e.status === "done"), -1);

  return (
    <div className="flex flex-col gap-6">
      <NextExamCountdown exams={exams} />

      {adding ? (
        <ExamForm onDone={() => setAdding(false)} />
      ) : (
        <Button onClick={() => setAdding(true)} className="self-start">
          <Plus size={16} />
          {dict.exams.add}
        </Button>
      )}

      {[
        { heading: dict.exams.upcoming, list: upcoming },
        { heading: dict.exams.done, list: done },
      ].map(({ heading, list }) =>
        list.length === 0 ? null : (
          <section key={heading}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {heading}
            </h2>
            <ul className="flex flex-col gap-2">
              {list.map((exam) =>
                editingId === exam.id ? (
                  <li key={exam.id}>
                    <ExamForm exam={exam} onDone={() => setEditingId(null)} />
                  </li>
                ) : (
                  <ExamRow key={exam.id} exam={exam} onEdit={() => setEditingId(exam.id)} />
                ),
              )}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

function ExamRow({ exam, onEdit }: { exam: Exam; onEdit: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.exams;
  const subject = SUBJECTS[exam.subject];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Comparing with "today" needs the browser's date, so only after mount.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  const overdue = exam.status === "upcoming" && today !== null && exam.exam_date < today;
  const isDone = exam.status === "done";

  function run(action: () => Promise<{ ok: boolean; error?: keyof typeof dict.common.error }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setError(dict.common.error[result.error]);
    });
  }

  const toggleStatus = () => run(() => setExamStatus(exam.id, isDone ? "upcoming" : "done"));
  const remove = () => {
    if (confirm(dict.common.confirmDelete)) run(() => deleteExam(exam.id));
  };

  return (
    <li
      className={cn("rounded-3xl border bg-card p-4", pending && "opacity-60", isDone && "bg-muted/40")}
    >
      <div className="flex items-start gap-3">
        <SubjectIcon subject={exam.subject} className="mt-1 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", isDone && "text-muted-foreground line-through decoration-1")}>
            {subject.label[locale]}
            {exam.title && <span className="font-normal"> · <bdi>{exam.title}</bdi></span>}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatDate(exam.exam_date, locale)}
              {exam.start_time && `, ${formatTime(exam.start_time)}`}
            </span>
            {exam.room && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {exam.room}
              </span>
            )}
            <span>{dict.examType[exam.type]}</span>
          </p>
          {exam.notes && <p className="mt-2 whitespace-pre-line text-sm" dir="auto">{exam.notes}</p>}
          {overdue && (
            <button
              type="button"
              onClick={toggleStatus}
              className="mt-2 rounded-md bg-amber-500/15 px-2 py-1 text-xs text-amber-800 hover:bg-amber-500/25 dark:text-amber-300"
            >
              {t.overdue}
            </button>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconButton label={isDone ? t.markUpcoming : t.markDone} onClick={toggleStatus} disabled={pending}>
            {isDone ? <RotateCcw size={16} /> : <Check size={16} />}
          </IconButton>
          <IconButton label={dict.common.edit} onClick={onEdit} disabled={pending}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label={dict.common.delete} onClick={remove} disabled={pending}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      <div className="mt-2 empty:hidden">
        <FormError message={error} />
      </div>
    </li>
  );
}
