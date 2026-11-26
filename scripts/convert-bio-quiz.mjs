// One-off converter: turns the question data inside
// content/bio/11.1/bio-quiz-lernspiel.html into an import file for /admin.
//
//   node scripts/convert-bio-quiz.mjs
//
// Writes content/imports/bio-11.1-quiz.json. Re-running and re-importing is safe:
// every item has a stable "key", so existing rows are updated, not duplicated.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";

const SRC = "content/bio/11.1/bio-quiz-lernspiel.html";
const OUT = "content/imports/bio-11.1-quiz.json";
const BLOCKS = { 1: "Block 1: Zelle & Membran", 2: "Block 2: Proteine & Enzyme" };

const html = readFileSync(SRC, "utf8");

// Find `const D=[ ... ]` and cut out the array literal (bracket matching, skipping strings).
const start = html.indexOf("[", html.indexOf("const D="));
let depth = 0, end = -1, quote = null;
for (let i = start; i < html.length; i++) {
  const ch = html[i];
  if (quote) {
    if (ch === "\\") i++;
    else if (ch === quote) quote = null;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === "`") quote = ch;
  else if (ch === "[") depth++;
  else if (ch === "]" && --depth === 0) { end = i; break; }
}
if (start < 0 || end < 0) throw new Error("Question array not found");
// Evaluate only the data literal, in an empty context.
const data = vm.runInNewContext(`(${html.slice(start, end + 1)})`, {}, { timeout: 1000 });

const clean = (s) =>
  String(s ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .trim();

const questions = [];
const cardsByBlock = { 1: [], 2: [] };
const skipped = {};
let n = 0;

for (const item of data) {
  n++;
  const key = `bio111-q${String(n).padStart(3, "0")}`;
  const base = { key, subject: "bio", topic: clean(item.top), _block: item.b };
  // Transfer tasks keep their material (experiment description) in `mat`.
  const prompt = item.mat ? `Material: ${clean(item.mat)}

${clean(item.q)}` : clean(item.q);
  if (item.t === "mc") {
    questions.push({ ...base, type: "single", prompt, options: item.o.map(clean), answer: item.c, explanation: item.ex ? [clean(item.ex)] : [] });
  } else if (item.t === "tf") {
    questions.push({ ...base, type: "single", prompt, options: ["Richtig", "Falsch"], answer: item.c ? 0 : 1, explanation: item.ex ? [clean(item.ex)] : [] });
  } else if (item.t === "fill") {
    questions.push({ ...base, type: "text", prompt, answer: [...new Set([...(item.acc ?? []), item.a].map(clean).filter(Boolean))], explanation: item.ex ? [clean(item.ex)] : [`Richtige Antwort: ${clean(item.a)}`] });
  } else if (item.t === "card") {
    (cardsByBlock[item.b] ??= []).push({ key: `bio111-card-${String(n).padStart(3, "0")}`, front: clean(item.q), back: clean(item.a) });
  } else {
    skipped[item.t] = (skipped[item.t] ?? 0) + 1;
  }
}

// Mini tests: per block, consecutive groups of 5–10 questions (topics stay together).
function chunk(list, max = 8) {
  const groups = Math.ceil(list.length / max);
  const size = Math.ceil(list.length / groups);
  return Array.from({ length: groups }, (_, i) => list.slice(i * size, (i + 1) * size)).filter((g) => g.length);
}

const quizzes = [];
for (const [b, title] of Object.entries(BLOCKS)) {
  const inBlock = questions.filter((q) => String(q._block) === b);
  if (!inBlock.length) continue;
  quizzes.push({
    key: `bio111-mock-b${b}`,
    kind: "mock",
    subject: "bio",
    topic: title,
    title: `Probeklausur ${title}`,
    description: "Alle Fragen dieses Blocks aus dem Bio-Quiz Klasse 11.",
    duration_minutes: Math.max(10, Math.round(inBlock.length * 0.75)),
    questions: inBlock.map((q) => q.key),
  });
  chunk(inBlock).forEach((group, i) => {
    if (group.length < 5) return;
    const topics = [...new Set(group.map((q) => q.topic))].join(", ");
    quizzes.push({
      key: `bio111-mini-b${b}-${i + 1}`,
      kind: "mini",
      subject: "bio",
      topic: topics,
      title: `Mini-Test ${b}.${i + 1}: ${topics}`,
      duration_minutes: 10,
      questions: group.map((q) => q.key),
    });
  });
}

const decks = Object.entries(cardsByBlock)
  .filter(([, cards]) => cards.length)
  .map(([b, cards]) => ({ key: `bio111-deck-b${b}`, subject: "bio", topic: BLOCKS[b], title: `Karteikarten ${BLOCKS[b]}`, cards }));

for (const q of questions) delete q._block;

mkdirSync("content/imports", { recursive: true });
writeFileSync(OUT, JSON.stringify({ questions, quizzes, decks }, null, 2) + "\n");

console.log(`${OUT}: ${questions.length} questions, ${quizzes.length} tests (${quizzes.filter((q) => q.kind === "mock").length} mock, ${quizzes.filter((q) => q.kind === "mini").length} mini), ${decks.length} decks with ${decks.reduce((s, d) => s + d.cards.length, 0)} cards`);
console.log("Skipped (no matching question type):", skipped);
for (const z of quizzes) console.log(` - [${z.kind}] ${z.title} – ${z.questions.length} questions${z.duration_minutes ? `, ${z.duration_minutes} min` : ""}`);
