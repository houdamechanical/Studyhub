import { readFile } from "node:fs/promises";
import path from "node:path";
import { getContent } from "@/lib/content";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Serves a study page's raw HTML.
 *
 * Security: the page is always delivered with a CSP `sandbox` directive (and is
 * embedded in an <iframe sandbox>), WITHOUT `allow-same-origin`. That gives it an
 * opaque origin, so its scripts run but cannot read the app's cookies, the
 * Supabase session, or anything else on this origin — even if the file is opened
 * directly in a new tab.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = getContent(id);
  if (!item) return new Response("Not found", { status: 404 });

  const filePath = path.resolve(CONTENT_DIR, item.file);
  if (!filePath.startsWith(CONTENT_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let html: string;
  try {
    html = await readFile(filePath, "utf8");
  } catch {
    return new Response("File missing", { status: 404 });
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals; frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "private, max-age=300",
    },
  });
}
