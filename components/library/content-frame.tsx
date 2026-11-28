"use client";

import { ArrowLeft, ArrowUp, Maximize, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const SANDBOX =
  "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals";

// Older Safari only has the prefixed Fullscreen API.
type FullscreenCapable = HTMLIFrameElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type WebkitDocument = Document & { webkitFullscreenEnabled?: boolean };

/**
 * Shows a study page in a sandboxed iframe.
 *
 * `sandbox` deliberately omits `allow-same-origin`: the page's own CSS and JS run
 * normally, but it gets an opaque origin, so it cannot touch the app's cookies or
 * Supabase session. (Side effect: localStorage is unavailable inside the page; pages
 * that need to remember something, like handwritten answers, ask the app through the
 * storage bridge below.) There is deliberately no "open in new tab": opened directly,
 * the page would not be sandboxed.
 */
export function ContentFrame({
  file,
  title,
  backHref,
  backLabel,
}: {
  file: string;
  title: string;
  backHref: string;
  backLabel: string;
}) {
  const { dict } = useI18n();
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Fallback when the browser has no Fullscreen API for elements (iPhone
  // Safari, and the home-screen app): the page fills the window instead.
  const [expanded, setExpanded] = useState(false);
  // Reading mode: scrolled down into the page → the app's bars step aside and
  // only "back" and "to the top" float over the page.
  const [reading, setReading] = useState(false);
  const readingRef = useRef(false);
  // Copied to public/content/ at build time (scripts/copy-content.mjs).
  // The page is told the app's light/dark mode: once in the URL (read before it paints),
  // then live via postMessage. Pages that don't care simply ignore both.
  const { resolvedTheme } = useTheme();
  const [initialTheme, setInitialTheme] = useState<string | null>(null);
  useEffect(() => {
    if (resolvedTheme && !initialTheme) setInitialTheme(resolvedTheme);
  }, [resolvedTheme, initialTheme]);
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "studyhub-theme", theme: resolvedTheme },
      "*",
    );
  }, [resolvedTheme]);
  const src = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/content/${file}?theme=${initialTheme ?? "light"}`;

  // Storage bridge: the sandboxed page has no localStorage of its own, so it asks
  // the app to keep small things for it (e.g. handwritten answer drafts). Only
  // messages from this frame are answered, and keys are kept per page.
  useEffect(() => {
    const prefix = `studyhub:page:${file}:`;
    const onMessage = (e: MessageEvent) => {
      const win = frameRef.current?.contentWindow;
      if (!win || e.source !== win) return;
      const d = e.data as { type?: string; key?: unknown; value?: unknown; reqId?: unknown } | null;
      if (!d || typeof d.key !== "string" || d.key.length > 120) return;
      if (d.type === "studyhub-store-get") {
        let value: string | null = null;
        try {
          value = localStorage.getItem(prefix + d.key);
        } catch {}
        win.postMessage({ type: "studyhub-store-value", reqId: d.reqId, key: d.key, value }, "*");
      } else if (d.type === "studyhub-store-set") {
        let ok = true;
        try {
          if (d.value === null) localStorage.removeItem(prefix + d.key);
          else if (typeof d.value === "string" && d.value.length < 2_000_000) localStorage.setItem(prefix + d.key, d.value);
          else ok = false;
        } catch {
          ok = false; // storage full
        }
        win.postMessage({ type: "studyhub-store-saved", reqId: d.reqId, key: d.key, ok }, "*");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [file]);

  useEffect(() => {
    let lastY = 0;
    const onScroll = (e: MessageEvent) => {
      const frame = frameRef.current;
      const win = frame?.contentWindow;
      if (!frame || !win || e.source !== win) return;
      const d = e.data as { type?: string; y?: unknown } | null;
      if (d?.type !== "studyhub-scroll" || typeof d.y !== "number") return;
      const y = d.y;
      const down = y > lastY;
      lastY = y;
      if (!readingRef.current && down && y > 200) {
        // The frame is about to move up to the top of the screen: scroll the page
        // up by the same amount so the text stays where it is.
        const offset = frame.getBoundingClientRect().top;
        readingRef.current = true;
        setReading(true);
        if (offset > 0) win.postMessage({ type: "studyhub-scroll-by", dy: -offset }, "*");
      } else if (readingRef.current && y < 30) {
        readingRef.current = false;
        setReading(false);
      }
    };
    window.addEventListener("message", onScroll);
    return () => window.removeEventListener("message", onScroll);
  }, []);

  function toTop() {
    frameRef.current?.contentWindow?.postMessage({ type: "studyhub-scroll-top" }, "*");
  }

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [expanded]);

  async function goFullscreen() {
    const el = frameRef.current as FullscreenCapable | null;
    const request = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
    if (
      el &&
      request &&
      (document.fullscreenEnabled ??
        (document as WebkitDocument).webkitFullscreenEnabled)
    ) {
      try {
        await request.call(el);
        return;
      } catch {
        // fall through to the in-page version
      }
    }
    setExpanded(true);
  }

  // One tree for both states, so the iframe is never re-created (it would
  // reload and lose the reader's place when going in or out of fullscreen).
  return (
    <div
      className={cn(
        "flex flex-col",
        expanded ? "fixed inset-0 z-50 bg-white" : reading ? "fixed inset-0 z-50 bg-background" : "flex-1",
      )}
    >
      {!expanded && !reading && (
        <div className="flex items-center gap-2 border-b px-2 py-1.5 sm:px-4">
          <Link
            href={backHref}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <h1
            className="min-w-0 flex-1 truncate text-sm font-medium"
            lang="de"
            dir="auto"
          >
            {title}
          </h1>
          <button
            type="button"
            onClick={goFullscreen}
            className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={dict.library.fullscreen}
            title={dict.library.fullscreen}
          >
            <Maximize size={16} />
          </button>
        </div>
      )}
      {initialTheme && (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          sandbox={SANDBOX}
          allow="fullscreen"
          allowFullScreen
          className={cn(
            "w-full flex-1 border-0 bg-background",
            !expanded && !reading && "min-h-[60dvh]",
          )}
        />
      )}
      {reading && !expanded && (
        <>
          <Link
            href={backHref}
            aria-label={backLabel}
            title={backLabel}
            className="press enter absolute start-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
          >
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </Link>
          <button
            type="button"
            onClick={toTop}
            aria-label={dict.library.toTop}
            title={dict.library.toTop}
            className="press enter absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 flex size-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
          >
            <ArrowUp size={21} />
          </button>
        </>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
          aria-label={dict.library.exitFullscreen}
          title={dict.library.exitFullscreen}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
