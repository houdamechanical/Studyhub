"use client";

import { LibraryBrowser } from "@/components/library/library-browser";
import { getAllContent } from "@/lib/content";
import { useI18n, useTitle } from "@/lib/i18n/client";

export default function LibraryPage() {
  const { dict } = useI18n();
  useTitle(dict.library.title);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.library.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.library.subtitle}</p>
      <LibraryBrowser items={getAllContent()} />
    </div>
  );
}
