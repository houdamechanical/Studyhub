"use client";

import { ArrowLeft, ExternalLink, Maximize } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/client";

/**
 * Shows a study page in a sandboxed iframe.
 *
 * `sandbox` deliberately omits `allow-same-origin`: the page's own CSS and JS run
 * normally, but it gets an opaque origin, so it cannot touch the app's cookies or
 * Supabase session. (Side effect: localStorage is unavailable inside the page, so
 * things like a quiz's high score are not remembered. The current pages handle
 * that gracefully.)
 */
export function ContentFrame({
  id,
  title,
  backHref,
  backLabel,
}: {
  id: string;
  title: string;
  backHref: string;
  backLabel: string;
}) {
  const { dict } = useI18n();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const src = `/api/content/${encodeURIComponent(id)}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-2 py-1.5 sm:px-4">
        <Link
          href={backHref}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium" lang="de" dir="auto">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => frameRef.current?.requestFullscreen?.()}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={dict.library.fullscreen}
          title={dict.library.fullscreen}
        >
          <Maximize size={16} />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={dict.library.openInNewTab}
          title={dict.library.openInNewTab}
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
        allow="fullscreen"
        allowFullScreen
        className="min-h-[60dvh] w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
