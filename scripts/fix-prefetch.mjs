// After `next build` (static export): Next.js writes segment prefetch files as
// nested folders, e.g.  library/__next.!KGFwcCk/library/__PAGE__.txt
// but the browser requests them under one flat name:
//                       library/__next.!KGFwcCk.library.__PAGE__.txt
// Static hosts like GitHub Pages can't map one to the other, so in-app
// navigation would fall back to full page reloads. This copies each file to
// the flat name as well. Runs automatically after `npm run build`.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const OUT = "out";
let copied = 0;

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? filesIn(p) : [p];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const file of filesIn(p)) {
        const flat = path.relative(dir, file).split(path.sep).join(".");
        copyFileSync(file, path.join(dir, flat));
        copied++;
      }
    } else {
      walk(p);
    }
  }
}

if (existsSync(OUT)) {
  walk(OUT);
  console.log(`fix-prefetch: added ${copied} flat prefetch files in ${OUT}/`);
}
