"use client";

import { CircleCheck, Trash2, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { addCard, deleteItem, importContent, type ImportResult } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass, Field, FormError } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { IMPORT_EXAMPLE, MINI_TEST_MAX, MINI_TEST_MIN, QUESTION_TYPES, type QuestionType, type QuizKind } from "@/lib/practice";
import { SUBJECT_IDS, SUBJECTS, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export type AdminData = {
  questions: { id: string; key: string | null; subject: SubjectId; topic: string; type: QuestionType; prompt: string }[];
  quizzes: { id: string; kind: QuizKind; subject: SubjectId; title: string; count: number }[];
  decks: { id: string; subject: SubjectId; title: string; count: number }[];
};

const TABS = ["import", "question", "quiz", "cards", "content"] as const;
type Tab = (typeof TABS)[number];

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const newKey = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function AdminPanel({ data }: { data: AdminData }) {
  const { dict } = useI18n();
  const t = dict.admin;
  const [tab, setTab] = useState<Tab>("import");
  const labels: Record<Tab, string> = {
    import: t.tabImport,
    question: t.tabQuestion,
    quiz: t.tabQuiz,
    cards: t.tabCards,
    content: t.tabContent,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-1 rounded-lg bg-muted p-1" role="tablist">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                tab === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[id]}
            </button>
          ))}
        </div>
      </div>
      {tab === "import" && <ImportTab />}
      {tab === "question" && <QuestionTab />}
      {tab === "quiz" && <QuizTab questions={data.questions} />}
      {tab === "cards" && <CardsTab decks={data.decks} />}
      {tab === "content" && <ContentTab data={data} />}
    </div>
  );
}

/** Shared feedback for anything that goes through importContent. */
function useImport() {
  const { dict } = useI18n();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const run = (payload: unknown, onSuccess?: () => void) =>
    startTransition(async () => {
      const r = await importContent(typeof payload === "string" ? payload : JSON.stringify(payload));
      setResult(r);
      if (r.ok) onSuccess?.();
    });
  const feedback = result ? (
    result.ok ? (
      <p className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:text-green-300" role="status">
        <CircleCheck size={16} />
        {fill(dict.admin.imported, { q: result.counts.questions, z: result.counts.quizzes, d: result.counts.decks, c: result.counts.cards })}
      </p>
    ) : (
      <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:text-red-400">
        <ul className="list-disc ps-4">
          {result.errors.slice(0, 20).map((e, i) => (
            <li key={i} className="font-mono text-xs">{e}</li>
          ))}
          {result.errors.length > 20 && <li>… +{result.errors.length - 20}</li>}
        </ul>
      </div>
    )
  ) : null;
  return { pending, run, feedback, clear: () => setResult(null) };
}

function ImportTab() {
  const { dict } = useI18n();
  const t = dict.admin;
  const [json, setJson] = useState("");
  const [showExample, setShowExample] = useState(false);
  const { pending, run, feedback, clear } = useImport();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setJson(await file.text());
      clear();
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t.importHint}</p>
      <div className="flex flex-wrap gap-2">
        <label className={cn(controlClass, "inline-flex w-auto cursor-pointer items-center gap-2")}>
          <Upload size={16} />
          {t.chooseFile}
          <input type="file" accept=".json,application/json" className="sr-only" onChange={onFile} />
        </label>
        <Button variant="ghost" onClick={() => setShowExample((v) => !v)}>
          {t.showExample}
        </Button>
      </div>
      {showExample && (
        <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs" dir="ltr">
          {IMPORT_EXAMPLE}
        </pre>
      )}
      <textarea
        className={cn(controlClass, "min-h-60 font-mono text-xs")}
        dir="ltr"
        spellCheck={false}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='{ "questions": [ … ], "quizzes": [ … ], "decks": [ … ] }'
      />
      {feedback}
      <Button className="self-end" onClick={() => run(json)} disabled={pending || !json.trim()}>
        {pending ? dict.common.saving : t.import}
      </Button>
    </div>
  );
}

function SubjectSelect({ value, onChange }: { value: SubjectId; onChange: (s: SubjectId) => void }) {
  const { locale, dict } = useI18n();
  return (
    <Field label={dict.exams.subject}>
      <select className={controlClass} value={value} onChange={(e) => onChange(e.target.value as SubjectId)}>
        {SUBJECT_IDS.map((id) => (
          <option key={id} value={id}>
            {SUBJECTS[id].emoji} {SUBJECTS[id].label[locale]}
          </option>
        ))}
      </select>
    </Field>
  );
}

function QuestionTab() {
  const { dict } = useI18n();
  const t = dict.admin;
  const blank = {
    subject: SUBJECT_IDS[0] as SubjectId,
    topic: "",
    type: "single" as QuestionType,
    prompt: "",
    options: "",
    correct: [] as number[],
    value: "",
    tolerance: "0",
    accepted: "",
    explanation: "",
    points: "1",
  };
  const [f, setF] = useState(blank);
  const { pending, run, feedback } = useImport();
  const opts = lines(f.options);
  const typeLabel = t.questionType;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const num = (s: string) => Number(s.replace(",", "."));
    const answer =
      f.type === "single"
        ? f.correct[0]
        : f.type === "multi"
          ? f.correct
          : f.type === "numeric"
            ? { value: num(f.value), tolerance: num(f.tolerance) || 0 }
            : lines(f.accepted);
    run(
      {
        questions: [
          {
            key: newKey(f.subject),
            subject: f.subject,
            topic: f.topic,
            type: f.type,
            prompt: f.prompt,
            options: opts,
            answer,
            explanation: lines(f.explanation),
            points: Number(f.points),
          },
        ],
      },
      // Keep subject/topic/type for the next question.
      () => setF({ ...blank, subject: f.subject, topic: f.topic, type: f.type }),
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SubjectSelect value={f.subject} onChange={(subject) => setF({ ...f, subject })} />
        <Field label={t.topic}>
          <input className={controlClass} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
        </Field>
        <Field label={dict.exams.type}>
          <select
            className={controlClass}
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value as QuestionType, correct: [] })}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {typeLabel[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t.prompt}>
        <textarea required rows={3} className={controlClass} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
      </Field>

      {(f.type === "single" || f.type === "multi") && (
        <>
          <Field label={t.options}>
            <textarea rows={4} className={controlClass} value={f.options} onChange={(e) => setF({ ...f, options: e.target.value, correct: [] })} />
          </Field>
          {opts.length > 0 && (
            <fieldset className="flex flex-col gap-1.5 text-sm">
              <legend className="mb-1.5 font-medium">{t.correct}</legend>
              {opts.map((o, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type={f.type === "single" ? "radio" : "checkbox"}
                    name="correct"
                    className="size-4 accent-[var(--chart-accent)]"
                    checked={f.correct.includes(i)}
                    onChange={() =>
                      setF({
                        ...f,
                        correct: f.type === "single" ? [i] : f.correct.includes(i) ? f.correct.filter((x) => x !== i) : [...f.correct, i],
                      })
                    }
                  />
                  {o}
                </label>
              ))}
            </fieldset>
          )}
        </>
      )}
      {f.type === "numeric" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.numericValue}>
            <input required inputMode="decimal" className={controlClass} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
          </Field>
          <Field label={t.tolerance}>
            <input inputMode="decimal" className={controlClass} value={f.tolerance} onChange={(e) => setF({ ...f, tolerance: e.target.value })} />
          </Field>
        </div>
      )}
      {f.type === "text" && (
        <Field label={t.accepted}>
          <textarea required rows={2} className={controlClass} value={f.accepted} onChange={(e) => setF({ ...f, accepted: e.target.value })} />
        </Field>
      )}

      <Field label={t.explanation}>
        <textarea rows={4} className={controlClass} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
      </Field>
      <Field label={t.points} className="w-32">
        <input type="number" min={1} max={100} className={controlClass} value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} />
      </Field>
      {feedback}
      <Button type="submit" className="self-end" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}

function QuizTab({ questions }: { questions: AdminData["questions"] }) {
  const { dict } = useI18n();
  const t = dict.admin;
  const [kind, setKind] = useState<QuizKind>("mini");
  const [subject, setSubject] = useState<SubjectId>(SUBJECT_IDS[0]);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("10");
  const [picked, setPicked] = useState<string[]>([]);
  const { pending, run, feedback } = useImport();

  const available = questions.filter((q) => q.subject === subject && q.key);
  const miniInvalid = kind === "mini" && (picked.length < MINI_TEST_MIN || picked.length > MINI_TEST_MAX);

  function save(e: React.FormEvent) {
    e.preventDefault();
    run(
      {
        quizzes: [
          {
            key: newKey(`${subject}-${kind}`),
            kind,
            subject,
            topic,
            title,
            description,
            duration_minutes: duration ? Number(duration) : undefined,
            questions: picked,
          },
        ],
      },
      () => {
        setTitle("");
        setPicked([]);
      },
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.kind}>
          <select className={controlClass} value={kind} onChange={(e) => setKind(e.target.value as QuizKind)}>
            <option value="mini">{dict.quiz.mini}</option>
            <option value="mock">{dict.quiz.mock}</option>
          </select>
        </Field>
        <SubjectSelect value={subject} onChange={(s) => { setSubject(s); setPicked([]); }} />
        <Field label={dict.exams.name} className="sm:col-span-2">
          <input required className={controlClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t.topic}>
          <input className={controlClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
        </Field>
        <Field label={t.duration}>
          <input type="number" min={1} max={600} required={kind === "mock"} className={controlClass} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field label={t.description} className="sm:col-span-2">
          <textarea rows={2} className={controlClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{fill(t.pickQuestions, { n: picked.length })}</legend>
        {kind === "mini" && <p className={cn("mb-2 text-xs", miniInvalid ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>{t.miniRule}</p>}
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noQuestions}</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border">
            {available.map((q) => (
              <li key={q.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm hover:bg-accent">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-[var(--chart-accent)]"
                    checked={picked.includes(q.key!)}
                    onChange={() => setPicked((p) => (p.includes(q.key!) ? p.filter((k) => k !== q.key) : [...p, q.key!]))}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{q.prompt}</span>
                    {q.topic && <span className="text-xs text-muted-foreground">{q.topic}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      {feedback}
      <Button type="submit" className="self-end" disabled={pending || picked.length === 0 || miniInvalid}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}

function CardsTab({ decks }: { decks: AdminData["decks"] }) {
  const { dict } = useI18n();
  const t = dict.admin;
  const NEW = "__new";
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? NEW);
  const [subject, setSubject] = useState<SubjectId>(SUBJECT_IDS[0]);
  const [deckTitle, setDeckTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { pending: importing, run, feedback } = useImport();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (deckId === NEW) {
      run({ decks: [{ key: newKey(`${subject}-deck`), subject, topic, title: deckTitle, cards: [{ front, back }] }] }, () => {
        setFront("");
        setBack("");
      });
      return;
    }
    startTransition(async () => {
      const r = await addCard(deckId, front, back);
      if (r.ok) {
        setMessage(t.cardAdded);
        setFront("");
        setBack("");
      } else setError(dict.common.error[r.error]);
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Field label={t.deck}>
        <select className={controlClass} value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.count})
            </option>
          ))}
          <option value={NEW}>+ {t.newDeck}</option>
        </select>
      </Field>
      {deckId === NEW && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SubjectSelect value={subject} onChange={setSubject} />
          <Field label={t.deckTitle}>
            <input required className={controlClass} value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} />
          </Field>
          <Field label={t.topic}>
            <input className={controlClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.front}>
          <textarea required rows={3} className={controlClass} value={front} onChange={(e) => setFront(e.target.value)} />
        </Field>
        <Field label={t.back}>
          <textarea required rows={3} className={controlClass} value={back} onChange={(e) => setBack(e.target.value)} />
        </Field>
      </div>
      {feedback}
      <FormError message={error} />
      {message && <p className="text-sm text-green-700 dark:text-green-400" role="status">{message}</p>}
      <Button type="submit" className="self-end" disabled={pending || importing}>
        {t.addCard}
      </Button>
    </form>
  );
}

function ContentTab({ data }: { data: AdminData }) {
  const { locale, dict } = useI18n();
  const t = dict.admin;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(kind: "question" | "quiz" | "deck", id: string) {
    if (!confirm(dict.common.confirmDelete)) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteItem(kind, id);
      if (!r.ok) setError(dict.common.error[r.error]);
    });
  }

  const groups = [
    {
      title: t.quizzesList,
      kind: "quiz" as const,
      rows: data.quizzes.map((q) => ({ id: q.id, subject: q.subject, text: q.title, meta: `${q.kind === "mock" ? dict.quiz.mock : dict.quiz.mini} · ${fill(dict.practice.questions, { n: q.count })}` })),
    },
    {
      title: t.decksList,
      kind: "deck" as const,
      rows: data.decks.map((d) => ({ id: d.id, subject: d.subject, text: d.title, meta: fill(dict.practice.cards, { n: d.count }) })),
    },
    {
      title: t.questionsList,
      kind: "question" as const,
      rows: data.questions.map((q) => ({ id: q.id, subject: q.subject, text: q.prompt, meta: [q.topic, t.questionType[q.type], q.key].filter(Boolean).join(" · ") })),
    },
  ];

  return (
    <div className={cn("flex flex-col gap-6", pending && "opacity-60")}>
      <FormError message={error} />
      {groups.map((g) => (
        <section key={g.kind}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {g.title} ({g.rows.length})
          </h2>
          {g.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.practice.noneYet}</p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto rounded-xl border bg-card">
              {g.rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: SUBJECTS[r.subject].color }} title={SUBJECTS[r.subject].label[locale]} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1">{r.text}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{r.meta}</span>
                  </span>
                  <IconButton label={dict.common.delete} onClick={() => remove(g.kind, r.id)} disabled={pending}>
                    <Trash2 size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
