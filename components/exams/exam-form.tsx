"use client";

import { useState, useTransition } from "react";
import { saveExam } from "@/lib/mutations/exams";
import { Button } from "@/components/ui/button";
import { controlClass, Field, FormError } from "@/components/ui/field";
import { EXAM_TYPES, type Exam } from "@/lib/exams";
import { formatTime, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";

export function ExamForm({ exam, onDone }: { exam?: Exam; onDone: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.exams;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: exam?.subject ?? SUBJECT_IDS[0],
    title: exam?.title ?? "",
    type: exam?.type ?? "klausur",
    exam_date: exam?.exam_date ?? todayISO(),
    start_time: formatTime(exam?.start_time ?? null),
    room: exam?.room ?? "",
    status: exam?.status ?? "upcoming",
    notes: exam?.notes ?? "",
  });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveExam({ ...form, id: exam?.id });
      if (result.ok) onDone();
      else setError(dict.common.error[result.error]);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border bg-card p-4">
      <h2 className="font-semibold">{exam ? t.editTitle : t.add}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.subject}>
          <select className={controlClass} value={form.subject} onChange={set("subject")}>
            {SUBJECT_IDS.map((id) => (
              <option key={id} value={id}>
                {SUBJECTS[id].emoji} {SUBJECTS[id].label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.type}>
          <select className={controlClass} value={form.type} onChange={set("type")}>
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {dict.examType[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`${t.name} (${dict.common.optional})`} className="sm:col-span-2">
          <input
            className={controlClass}
            value={form.title}
            onChange={set("title")}
            placeholder={t.namePlaceholder}
            maxLength={120}
          />
        </Field>
        <Field label={t.date}>
          <input type="date" required className={controlClass} value={form.exam_date} onChange={set("exam_date")} />
        </Field>
        <Field label={`${t.time} (${dict.common.optional})`}>
          <input type="time" className={controlClass} value={form.start_time} onChange={set("start_time")} />
        </Field>
        <Field label={`${t.room} (${dict.common.optional})`}>
          <input className={controlClass} value={form.room} onChange={set("room")} maxLength={60} />
        </Field>
        {exam && (
          <Field label={t.status}>
            <select className={controlClass} value={form.status} onChange={set("status")}>
              <option value="upcoming">{t.statusUpcoming}</option>
              <option value="done">{t.statusDone}</option>
            </select>
          </Field>
        )}
        <Field label={`${t.notes} (${dict.common.optional})`} className="sm:col-span-2">
          <textarea
            className={controlClass}
            rows={2}
            value={form.notes}
            onChange={set("notes")}
            maxLength={1000}
          />
        </Field>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? dict.common.saving : dict.common.save}
        </Button>
      </div>
    </form>
  );
}
