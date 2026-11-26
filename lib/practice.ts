import type { SubjectId } from "@/lib/subjects";

export const QUESTION_TYPES = ["single", "multi", "numeric", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type QuizKind = "mock" | "mini";

/** A question as students see it before submitting (no solution). */
export type Question = {
  id: string;
  key: string | null;
  subject: SubjectId;
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  points: number;
};

/** Stored solution shapes (question_solutions.answer). */
export type Solution =
  | { choice: number }
  | { choices: number[] }
  | { value: number; tolerance?: number }
  | { accepted: string[] };

/** What a student answered: choice index, list of indices, or typed text. */
export type GivenAnswer = number | number[] | string | null;

export type Quiz = {
  id: string;
  key: string | null;
  kind: QuizKind;
  subject: SubjectId;
  topic: string;
  title: string;
  description: string;
  duration_minutes: number | null;
};

export type ReviewItem = {
  question_id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  points: number;
  given: GivenAnswer;
  answer: Solution | null;
  explanation: string[];
  correct: boolean;
};

export type Attempt = {
  id: string;
  quiz_id: string;
  timed: boolean;
  started_at: string;
  deadline: string | null;
  submitted_at: string | null;
  over_time: boolean;
  score: number | null;
  max_score: number | null;
  review: ReviewItem[] | null;
};

export const MINI_TEST_MIN = 5;
export const MINI_TEST_MAX = 10;

// ---------------------------------------------------------------------------
// Spaced repetition (SM-2)
// ---------------------------------------------------------------------------

export const RATINGS = ["again", "hard", "good", "easy"] as const;
export type Rating = (typeof RATINGS)[number];

/** SM-2 quality 0–5 for each button. */
const QUALITY: Record<Rating, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export type ReviewState = { ease: number; interval_days: number; repetitions: number };

/**
 * Classic SM-2 (SuperMemo 2):
 *  - quality < 3: start over, see it again tomorrow
 *  - otherwise intervals 1 day, 6 days, then previous interval × ease
 *  - ease changes by 0.1 − (5−q)·(0.08 + (5−q)·0.02), never below 1.3
 */
export function sm2(prev: ReviewState | null, rating: Rating): ReviewState {
  const q = QUALITY[rating];
  const ease = prev?.ease ?? 2.5;
  let repetitions = prev?.repetitions ?? 0;
  let interval = prev?.interval_days ?? 0;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * ease);
  }

  const nextEase = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return { ease: Math.round(nextEase * 100) / 100, interval_days: interval, repetitions };
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// JSON import format (admin page)
// ---------------------------------------------------------------------------

export type ImportQuestion = {
  key: string;
  subject: SubjectId;
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  points: number;
  answer: Solution;
  explanation: string[];
};
export type ImportQuiz = {
  key: string | null;
  kind: QuizKind;
  subject: SubjectId;
  topic: string;
  title: string;
  description: string;
  duration_minutes: number | null;
  questions: string[]; // question keys, in order
};
export type ImportDeck = {
  key: string | null;
  subject: SubjectId;
  topic: string;
  title: string;
  cards: { key: string | null; front: string; back: string }[];
};
export type ImportPayload = { questions: ImportQuestion[]; quizzes: ImportQuiz[]; decks: ImportDeck[] };

export const IMPORT_EXAMPLE = `{
  "questions": [
    {
      "key": "bio-enzyme-1",
      "subject": "bio",
      "topic": "Enzyme",
      "type": "single",
      "prompt": "Was senken Enzyme?",
      "options": ["Die Aktivierungsenergie", "Die Reaktionsenthalpie", "Die Temperatur"],
      "answer": 0,
      "explanation": ["Enzyme sind Katalysatoren.", "Sie senken die Aktivierungsenergie, ΔH bleibt gleich."]
    },
    { "key": "math-ableitung-1", "subject": "math", "type": "numeric",
      "prompt": "f(x) = x². Wie groß ist f'(3)?", "answer": { "value": 6, "tolerance": 0 },
      "explanation": ["f'(x) = 2x", "f'(3) = 2 · 3 = 6"] },
    { "key": "bio-osmose-1", "subject": "bio", "type": "text",
      "prompt": "Wie heißt die Diffusion von Wasser durch eine semipermeable Membran?",
      "answer": ["Osmose", "osmosis"] },
    { "key": "chemie-1", "subject": "chemie", "type": "multi",
      "prompt": "Welche Stoffe sind Elemente?", "options": ["O₂", "H₂O", "Fe", "NaCl"], "answer": [0, 2] }
  ],
  "quizzes": [
    { "key": "bio-mini-enzyme", "kind": "mini", "subject": "bio", "topic": "Enzyme",
      "title": "Mini-Test Enzyme", "duration_minutes": 10,
      "questions": ["bio-enzyme-1", "bio-osmose-1", "..."] }
  ],
  "decks": [
    { "key": "bio-begriffe", "subject": "bio", "topic": "Zelle", "title": "Zellbiologie – Begriffe",
      "cards": [{ "front": "Prokaryot", "back": "Zelle ohne Zellkern" }] }
  ]
}`;

type Errors = string[];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function strList(v: unknown): string[] {
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x.trim()).map((x) => (x as string).trim());
  return [];
}

/**
 * Validate and normalise an import. `isSubject` is passed in so this file has no
 * runtime dependency on the subjects list. Returns errors with a path to the problem.
 */
export function parseImport(
  input: unknown,
  isSubject: (s: string) => s is SubjectId,
): { payload: ImportPayload; errors: Errors } {
  const errors: Errors = [];
  const payload: ImportPayload = { questions: [], quizzes: [], decks: [] };
  if (!isObj(input)) return { payload, errors: ["The JSON must be an object with questions, quizzes and/or decks."] };

  const subjectOk = (v: unknown, path: string) => {
    if (typeof v === "string" && isSubject(v)) return true;
    errors.push(`${path}.subject: unknown subject ${JSON.stringify(v)}`);
    return false;
  };

  const questionKeys = new Set<string>();
  (Array.isArray(input.questions) ? input.questions : []).forEach((q, i) => {
    const p = `questions[${i}]`;
    if (!isObj(q)) return void errors.push(`${p}: must be an object`);
    const type = q.type as QuestionType;
    const prompt = str(q.prompt, 4000);
    const options = strList(q.options).map((o) => o.slice(0, 500));
    const key = str(q.key, 120) || `auto-${crypto.randomUUID()}`;
    if (!subjectOk(q.subject, p)) return;
    if (!(QUESTION_TYPES as readonly string[]).includes(type)) return void errors.push(`${p}.type: use single, multi, numeric or text`);
    if (!prompt) return void errors.push(`${p}.prompt: missing`);
    if (questionKeys.has(key)) return void errors.push(`${p}.key: "${key}" is used twice`);

    let answer: Solution | null = null;
    const a = q.answer;
    if (type === "single") {
      if (options.length < 2) return void errors.push(`${p}.options: needs at least 2 options`);
      if (isInt(a) && a >= 0 && a < options.length) answer = { choice: a };
      else return void errors.push(`${p}.answer: index of the correct option (0 = first)`);
    } else if (type === "multi") {
      if (options.length < 2) return void errors.push(`${p}.options: needs at least 2 options`);
      if (Array.isArray(a) && a.length > 0 && a.every((x) => isInt(x) && x >= 0 && x < options.length)) {
        answer = { choices: [...new Set(a as number[])].sort((x, y) => x - y) };
      } else return void errors.push(`${p}.answer: list of correct option indexes, e.g. [0, 2]`);
    } else if (type === "numeric") {
      const value = typeof a === "number" ? a : isObj(a) ? a.value : undefined;
      const tolerance = isObj(a) && typeof a.tolerance === "number" ? Math.abs(a.tolerance) : 0;
      if (typeof value === "number" && Number.isFinite(value)) answer = { value, tolerance };
      else return void errors.push(`${p}.answer: a number, or { "value": 2.5, "tolerance": 0.01 }`);
    } else {
      const accepted = strList(a).map((x) => x.slice(0, 200));
      if (accepted.length) answer = { accepted };
      else return void errors.push(`${p}.answer: accepted answer text, or a list of them`);
    }

    const points = q.points === undefined ? 1 : q.points;
    if (!isInt(points) || points < 1 || points > 100) return void errors.push(`${p}.points: whole number 1–100`);

    questionKeys.add(key);
    payload.questions.push({
      key,
      subject: q.subject as SubjectId,
      topic: str(q.topic, 120),
      type,
      prompt,
      options: type === "single" || type === "multi" ? options : [],
      points,
      answer,
      explanation: strList(q.explanation).map((x) => x.slice(0, 2000)),
    });
  });

  (Array.isArray(input.quizzes) ? input.quizzes : []).forEach((z, i) => {
    const p = `quizzes[${i}]`;
    if (!isObj(z)) return void errors.push(`${p}: must be an object`);
    if (!subjectOk(z.subject, p)) return;
    if (z.kind !== "mock" && z.kind !== "mini") return void errors.push(`${p}.kind: "mock" (mock exam) or "mini" (mini test)`);
    const title = str(z.title, 200);
    if (!title) return void errors.push(`${p}.title: missing`);
    const keys = strList(z.questions);
    if (keys.length === 0) return void errors.push(`${p}.questions: list of question keys`);
    if (z.kind === "mini" && (keys.length < MINI_TEST_MIN || keys.length > MINI_TEST_MAX)) {
      return void errors.push(`${p}.questions: a mini test has ${MINI_TEST_MIN}–${MINI_TEST_MAX} questions (has ${keys.length})`);
    }
    const duration = z.duration_minutes;
    if (duration !== undefined && duration !== null && !(isInt(duration) && duration >= 1 && duration <= 600)) {
      return void errors.push(`${p}.duration_minutes: whole number 1–600`);
    }
    if (z.kind === "mock" && !isInt(duration)) return void errors.push(`${p}.duration_minutes: a mock exam needs a duration`);
    payload.quizzes.push({
      key: str(z.key, 120) || null,
      kind: z.kind,
      subject: z.subject as SubjectId,
      topic: str(z.topic, 120),
      title,
      description: str(z.description, 2000),
      duration_minutes: isInt(duration) ? duration : null,
      questions: keys,
    });
  });

  (Array.isArray(input.decks) ? input.decks : []).forEach((d, i) => {
    const p = `decks[${i}]`;
    if (!isObj(d)) return void errors.push(`${p}: must be an object`);
    if (!subjectOk(d.subject, p)) return;
    const title = str(d.title, 200);
    if (!title) return void errors.push(`${p}.title: missing`);
    const cards = (Array.isArray(d.cards) ? d.cards : []).flatMap((c, j) => {
      const front = isObj(c) ? str(c.front, 2000) : "";
      const back = isObj(c) ? str(c.back, 4000) : "";
      if (!front || !back) {
        errors.push(`${p}.cards[${j}]: needs front and back`);
        return [];
      }
      return [{ key: isObj(c) ? str(c.key, 160) || null : null, front, back }];
    });
    if (cards.length === 0) return void errors.push(`${p}.cards: at least one card`);
    payload.decks.push({ key: str(d.key, 120) || null, subject: d.subject as SubjectId, topic: str(d.topic, 120), title, cards });
  });

  if (!payload.questions.length && !payload.quizzes.length && !payload.decks.length && !errors.length) {
    errors.push("Nothing to import: add questions, quizzes or decks.");
  }
  return { payload, errors };
}
