import { dataChanged } from "@/lib/data";
import { cleanText, isUuid, requireUser, type ActionResult } from "@/lib/actions";
import { parseImport, type ImportPayload } from "@/lib/practice";
import { isSubjectId } from "@/lib/subjects";

/** Signed-in admin, or null. (RLS enforces this again on every write.) */
async function requireAdmin() {
  const auth = await requireUser();
  if (!auth) return null;
  const { data } = await auth.supabase.rpc("is_admin");
  return data === true ? auth : null;
}

export type ImportResult =
  | { ok: true; counts: { questions: number; quizzes: number; decks: number; cards: number } }
  | { ok: false; errors: string[] };

/**
 * Import questions, quizzes and decks from JSON. Items with a `key` are updated
 * if they already exist, so the same file can be imported again after edits.
 */
export async function importContent(json: string): Promise<ImportResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, errors: ["Not allowed: admins only."] };
  const db = auth.supabase;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  const { payload, errors } = parseImport(raw, isSubjectId);
  if (errors.length) return { ok: false, errors };

  try {
    const counts = await writeImport(db, payload);
    dataChanged();
    return { ok: true, counts };
  } catch (e) {
    console.error("importContent", e);
    return { ok: false, errors: [(e as Error).message] };
  }
}

type Db = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>["supabase"];

async function writeImport(db: Db, payload: ImportPayload) {
  const fail = (what: string, error: { message: string } | null) => {
    if (error) throw new Error(`${what}: ${error.message}`);
  };

  // 1. Questions (upsert by key) + their solutions
  const keyToId = new Map<string, string>();
  if (payload.questions.length) {
    const { data, error } = await db
      .from("questions")
      .upsert(
        payload.questions.map(({ key, subject, topic, type, prompt, options, points }) => ({
          key, subject, topic, type, prompt, options, points,
        })),
        { onConflict: "key" },
      )
      .select("id, key");
    fail("questions", error);
    for (const row of data ?? []) keyToId.set(row.key, row.id);

    const { error: solError } = await db.from("question_solutions").upsert(
      payload.questions.map((q) => ({ question_id: keyToId.get(q.key)!, answer: q.answer, explanation: q.explanation })),
    );
    fail("solutions", solError);
  }

  // 2. Quizzes; question keys may also refer to questions imported earlier
  const missingKeys = [...new Set(payload.quizzes.flatMap((z) => z.questions))].filter((k) => !keyToId.has(k));
  if (missingKeys.length) {
    const { data, error } = await db.from("questions").select("id, key").in("key", missingKeys);
    fail("lookup questions", error);
    for (const row of data ?? []) keyToId.set(row.key, row.id);
    const unknown = missingKeys.filter((k) => !keyToId.has(k));
    if (unknown.length) throw new Error(`Unknown question keys in quizzes: ${unknown.join(", ")}`);
  }
  for (const quiz of payload.quizzes) {
    const row = {
      kind: quiz.kind, subject: quiz.subject, topic: quiz.topic, title: quiz.title,
      description: quiz.description, duration_minutes: quiz.duration_minutes,
    };
    const { data, error } = quiz.key
      ? await db.from("quizzes").upsert({ key: quiz.key, ...row }, { onConflict: "key" }).select("id").single()
      : await db.from("quizzes").insert(row).select("id").single();
    fail(`quiz "${quiz.title}"`, error);
    const quizId = data!.id;
    const { error: delError } = await db.from("quiz_questions").delete().eq("quiz_id", quizId);
    fail(`quiz "${quiz.title}"`, delError);
    const { error: qqError } = await db.from("quiz_questions").insert(
      quiz.questions.map((k, position) => ({ quiz_id: quizId, question_id: keyToId.get(k)!, position })),
    );
    fail(`quiz "${quiz.title}"`, qqError);
  }

  // 3. Decks + cards. Cards keep their id (and everyone's review progress) when
  //    re-imported; cards no longer in the file are removed.
  let cardCount = 0;
  for (const deck of payload.decks) {
    const row = { subject: deck.subject, topic: deck.topic, title: deck.title };
    const { data, error } = deck.key
      ? await db.from("decks").upsert({ key: deck.key, ...row }, { onConflict: "key" }).select("id").single()
      : await db.from("decks").insert(row).select("id").single();
    fail(`deck "${deck.title}"`, error);
    const deckId = data!.id;

    const cards = deck.cards.map((c, position) => ({
      key: c.key ?? (deck.key ? `${deck.key}#${position + 1}` : null),
      deck_id: deckId,
      front: c.front,
      back: c.back,
      position,
    }));
    const keyed = cards.filter((c) => c.key);
    const unkeyed = cards.filter((c) => !c.key);
    const keptIds: string[] = [];
    if (keyed.length) {
      const { data: rows, error: e1 } = await db.from("cards").upsert(keyed, { onConflict: "key" }).select("id");
      fail(`cards of "${deck.title}"`, e1);
      keptIds.push(...(rows ?? []).map((r) => r.id));
    }
    if (unkeyed.length) {
      const { data: rows, error: e2 } = await db.from("cards").insert(unkeyed).select("id");
      fail(`cards of "${deck.title}"`, e2);
      keptIds.push(...(rows ?? []).map((r) => r.id));
    }
    if (deck.key) {
      const { error: e3 } = await db
        .from("cards")
        .delete()
        .eq("deck_id", deckId)
        .not("id", "in", `(${keptIds.join(",")})`);
      fail(`cards of "${deck.title}"`, e3);
    }
    cardCount += cards.length;
  }

  return {
    questions: payload.questions.length,
    quizzes: payload.quizzes.length,
    decks: payload.decks.length,
    cards: cardCount,
  };
}

const TABLES = { question: "questions", quiz: "quizzes", deck: "decks", card: "cards" } as const;

export async function deleteItem(kind: keyof typeof TABLES, id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "unauthorized" };
  if (!(kind in TABLES) || !isUuid(id)) return { ok: false, error: "invalid" };
  const { error } = await auth.supabase.from(TABLES[kind]).delete().eq("id", id);
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}

export async function addCard(deckId: string, front: string, back: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "unauthorized" };
  const f = cleanText(front, 2000);
  const b = cleanText(back, 4000);
  if (!isUuid(deckId) || !f || !b) return { ok: false, error: "invalid" };
  const { count } = await auth.supabase.from("cards").select("id", { count: "exact", head: true }).eq("deck_id", deckId);
  const { error } = await auth.supabase.from("cards").insert({ deck_id: deckId, front: f, back: b, position: count ?? 0 });
  if (error) return { ok: false, error: "failed" };
  dataChanged();
  return { ok: true };
}
