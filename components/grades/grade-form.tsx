"use client";

import { useState, useTransition } from "react";
import { saveGrade } from "@/app/(app)/grades/actions";
import { Button } from "@/components/ui/button";
import { controlClass, Field, FormError } from "@/components/ui/field";
import { CURRENT_SEMESTER, SCALE_RANGE, SCALES, type Grade, type Scale } from "@/lib/grades";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { formatSemester } from "@/lib/i18n/dictionaries";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";

const SEMESTER_OPTIONS = ["10.1", "10.2", "11.1", "11.2", "12.1", "12.2", "13.1", "13.2"];

/** Accepts "2,3" as well as "2.3". */
const parseNumber = (text: string) => Number(text.trim().replace(",", "."));

export function GradeForm({
  grade,
  defaultScale,
  defaultSemester,
  onDone,
}: {
  grade?: Grade;
  defaultScale: Scale;
  defaultSemester?: string;
  onDone: () => void;
}) {
  const { locale, dict } = useI18n();
  const t = dict.grades;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: grade?.subject ?? SUBJECT_IDS[0],
    semester: grade?.semester ?? defaultSemester ?? CURRENT_SEMESTER,
    title: grade?.title ?? "",
    scale: grade?.scale ?? defaultScale,
    value: grade ? String(grade.value) : "",
    weight: grade ? String(grade.weight) : "1",
    graded_on: grade?.graded_on ?? todayISO(),
  });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const range = SCALE_RANGE[form.scale as Scale];
  const value = parseNumber(form.value);
  const valueInvalid = form.value !== "" && (!Number.isFinite(value) || value < range.min || value > range.max);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (valueInvalid || form.value === "") {
      setError(dict.common.error.invalid);
      return;
    }
    startTransition(async () => {
      const result = await saveGrade({
        ...form,
        id: grade?.id,
        value,
        weight: parseNumber(form.weight),
      });
      if (result.ok) onDone();
      else setError(dict.common.error[result.error]);
    });
  }

  const semesters = SEMESTER_OPTIONS.includes(form.semester)
    ? SEMESTER_OPTIONS
    : [...SEMESTER_OPTIONS, form.semester];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">{grade ? t.editTitle : t.add}</h2>
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
        <Field label={t.semester}>
          <select className={controlClass} value={form.semester} onChange={set("semester")}>
            {semesters.map((s) => (
              <option key={s} value={s}>
                {formatSemester(s, dict)}
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
        <Field label={t.scale}>
          <select className={controlClass} value={form.scale} onChange={set("scale")}>
            {SCALES.map((s) => (
              <option key={s} value={s}>
                {t.scaleName[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.value} hint={`${range.min} – ${range.max}`}>
          <input
            className={controlClass}
            inputMode="decimal"
            required
            value={form.value}
            onChange={set("value")}
            aria-invalid={valueInvalid}
            placeholder={form.scale === "grade" ? "2,3" : form.scale === "points" ? "11" : "87"}
          />
        </Field>
        <Field label={t.weight} hint={t.weightHint}>
          <input className={controlClass} inputMode="decimal" required value={form.weight} onChange={set("weight")} />
        </Field>
        <Field label={t.date}>
          <input type="date" required className={controlClass} value={form.graded_on} onChange={set("graded_on")} />
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
