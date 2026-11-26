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
console.log(`copied ${index.length} study pages to public/content/`);
