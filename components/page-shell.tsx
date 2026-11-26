"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import type { LoadState } from "@/lib/data";
import { useI18n, useTitle } from "@/lib/i18n/client";
import { hasEnvVars } from "@/lib/utils";

/** Page title + subtitle; sets the browser tab title too. */
export function PageShell({
  title,
  subtitle,
  width = "max-w-3xl",
  children,
}: {
  title?: string;
  subtitle?: string;
  width?: string;
  children: React.ReactNode;
}) {
  useTitle(title);
  return (
    <div className={`mx-auto w-full ${width} px-4 py-6`}>
      {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
      {subtitle && <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

/** Spinner while loading, setup hints on errors, else the content. */
export function Loaded<T>({ state, children }: { state: LoadState<T>; children: (data: T) => React.ReactNode }) {
  if (!hasEnvVars) return <SetupNotice problem="no-env" />;
  if (state.error) {
    console.error(state.error);
    const missing = isMissingTable(state.error) || state.error.code === "PGRST202";
    return <SetupNotice problem={missing ? "no-table" : "error"} />;
  }
  if (state.loading || state.data === null) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground" aria-busy>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }
  return <>{children(state.data)}</>;
}

/** Shown instead of notFound() in client pages (e.g. unknown ?id=). */
export function NotFoundMessage() {
  const { dict } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-semibold">{dict.notFound.title}</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        {dict.notFound.back}
      </Link>
    </div>
  );
}
