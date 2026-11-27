// Copies the study pages from content/ to public/content/ so they are published
// as static files next to the app. Runs automatically before `dev` and `build`.
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const index = JSON.parse(readFileSync("content/index.json", "utf8"));
rmSync("public/content", { recursive: true, force: true });
for (const item of index) {
  const from = path.join("content", item.file);
  const to = path.join("public", "content", item.file);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
}
// Shared assets the pages link to (KaTeX for formulas, the math page theme).
cpSync(path.join("content", "_shared"), path.join("public", "content", "_shared"), { recursive: true });
console.log(`copied ${index.length} study pages to public/content/`);
