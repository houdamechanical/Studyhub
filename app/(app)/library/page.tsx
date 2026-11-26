import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library/library-browser";
import { getAllContent } from "@/lib/content";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.library.title };
}

export default async function LibraryPage() {
  const { dict } = await getI18n();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.library.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.library.subtitle}</p>
      <LibraryBrowser items={getAllContent()} />
    </div>
  );
}
