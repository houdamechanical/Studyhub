"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { SubjectIcon } from "@/components/subject-icon";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { saveElectives } from "@/lib/mutations/compare";
import { ART_TEACHER_NAMES, ART_TEACHERS, type ArtTeacher } from "@/lib/exams";
import { ARTS, isValidElectives, SCIENCES, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** Pick Art or Music, and two of Biology / Chemistry / Arabic. */
export function ElectivesPicker({
  value,
  onChange,
  teacher,
  onTeacher,
}: {
  value: SubjectId[];
  onChange: (next: SubjectId[]) => void;
  teacher: ArtTeacher | null;
  onTeacher: (t: ArtTeacher) => void;
}) {
  const { dict } = useI18n();
  const t = dict.electives;
  const arts = value.filter((s) => (ARTS as readonly SubjectId[]).includes(s));
  const sciences = value.filter((s) => (SCIENCES as readonly SubjectId[]).includes(s));

  function pickArt(id: SubjectId) {
    onChange([id, ...sciences]);
  }
  function toggleScience(id: SubjectId) {
    if (sciences.includes(id)) onChange([...arts, ...sciences.filter((s) => s !== id)]);
    // Two at most: picking a third replaces the oldest pick.
    else onChange([...arts, ...(sciences.length >= 2 ? sciences.slice(1) : sciences), id]);
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.arts}</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-2">
          {ARTS.map((id) => (
            <Choice key={id} id={id} on={arts.includes(id)} role="radio" onClick={() => pickArt(id)} />
          ))}
        </div>
        {arts.includes("kunst") && (
          <div role="radiogroup" aria-label={t.artTeacher} className="enter mt-3">
            <p className="mb-2 text-sm text-muted-foreground">{t.artTeacher}</p>
            <div className="grid grid-cols-2 gap-2">
              {ART_TEACHERS.map((id) => {
                const on = teacher === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onTeacher(id)}
                    className={cn(
                      "press flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium",
                      on
                        ? "border-primary bg-[color-mix(in_srgb,var(--c-amber)_10%,transparent)] text-foreground"
                        : "bg-card text-muted-foreground hover:border-[var(--c-border-strong)] hover:text-foreground",
                    )}
                  >
                    {on && <Check size={15} strokeWidth={3} className="text-[var(--c-amber)]" />}
                    {ART_TEACHER_NAMES[id]}
                    <span className="text-xs uppercase text-muted-foreground">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          {t.sciences} <span className="font-normal tabular-nums text-muted-foreground">({sciences.length}/2)</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {SCIENCES.map((id) => (
            <Choice key={id} id={id} on={sciences.includes(id)} role="checkbox" onClick={() => toggleScience(id)} />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function Choice({ id, on, role, onClick }: { id: SubjectId; on: boolean; role: "radio" | "checkbox"; onClick: () => void }) {
  const { locale } = useI18n();
  return (
    <button
      type="button"
      role={role}
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "press relative flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm font-medium",
        on
          ? "border-primary bg-[color-mix(in_srgb,var(--c-amber)_10%,transparent)] text-foreground"
          : "bg-card text-muted-foreground hover:border-[var(--c-border-strong)] hover:text-foreground",
      )}
    >
      {on && (
        <span className="check-pop absolute end-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      <SubjectIcon subject={id} className={cn("size-6", on && "text-[var(--c-amber)]")} strokeWidth={1.75} />
      {SUBJECTS[id].label[locale]}
    </button>
  );
}

/** Saves a choice; shared by the first-run screen and Settings. */
export function useSaveElectives(onSaved: (list: SubjectId[], teacher: ArtTeacher | null) => void) {
  const { dict } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(list: SubjectId[], teacher: ArtTeacher | null) {
    setSaving(true);
    setError(null);
    const art = list.includes("kunst") ? teacher : null;
    const r = await saveElectives(list, art);
    setSaving(false);
    if (r.ok) {
      toast(dict.electives.saved);
      onSaved(list, art);
    } else setError(dict.common.error[r.error]);
  }
  return { save, saving, error };
}

/** First-run screen (after the name): which subjects do you take? */
export function ElectivesOnboarding({
  initial,
  initialTeacher,
  onDone,
}: {
  initial?: SubjectId[] | null;
  initialTeacher?: ArtTeacher | null;
  onDone: (list: SubjectId[], teacher: ArtTeacher | null) => void;
}) {
  const { dict } = useI18n();
  const t = dict.electives;
  const [value, setValue] = useState<SubjectId[]>(initial ?? []);
  const [teacher, setTeacher] = useState<ArtTeacher | null>(initialTeacher ?? null);
  const { save, saving, error } = useSaveElectives(onDone);
  const valid = isValidElectives(value) && (!value.includes("kunst") || teacher !== null);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) save(value, teacher);
        }}
        className="enter w-full max-w-md rounded-xl border bg-card shadow-card p-7 sm:p-9"
      >
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
        <div className="mt-6">
          <ElectivesPicker value={value} onChange={setValue} teacher={teacher} onTeacher={setTeacher} />
        </div>
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={!valid || saving} className="group mt-6 h-14 w-full rounded-xl text-base">
          {saving ? <Loader2 className="animate-spin" /> : t.cta}
          {!saving && <ArrowRight className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />}
        </Button>
      </form>
    </div>
  );
}
