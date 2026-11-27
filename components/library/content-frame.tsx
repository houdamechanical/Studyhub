"use client";

import { ArrowLeft, Maximize, X } from "lucide-react";
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
 * Supabase session. (Side effect: localStorage is unavailable inside the page, so
 * things like a quiz's high score are not remembered. The current pages handle
 * that gracefully.) There is deliberately no "open in new tab": opened directly,
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
        expanded ? "fixed inset-0 z-50 bg-white" : "flex-1",
      )}
    >
      {!expanded && (
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
            !expanded && "min-h-[60dvh]",
          )}
        />
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
