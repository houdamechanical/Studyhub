import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/library/content-card";
import { getContentForSubject, groupBySemesterAndTopic } from "@/lib/content";
import { formatPageCount, formatSemester } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { isSubjectId, SUBJECTS } from "@/lib/subjects";

type Props = { params: Promise<{ subject: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params;
  if (!isSubjectId(subject)) return {};
  const { locale } = await getI18n();
  return { title: SUBJECTS[subject].label[locale] };
}

export default async function SubjectPage({ params }: Props) {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();

  const { locale, dict } = await getI18n();
  const info = SUBJECTS[subject];
  const items = getContentForSubject(subject);
  const semesters = groupBySemesterAndTopic(items);

  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-6"
      style={{ "--subject": info.color } as React.CSSProperties}
    >
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {dict.library.backToLibrary}
      </Link>

      <header className="mt-3 mb-6 flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--subject)_15%,transparent)] text-2xl"
          aria-hidden
        >
          {info.emoji}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{info.label[locale]}</h1>
          <p className="text-sm text-muted-foreground">{formatPageCount(items.length, dict)}</p>
        </div>
      </header>

      {semesters.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {dict.library.emptySubject}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {semesters.map(({ semester, topics }) => (
            <section key={semester}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {formatSemester(semester, dict)}
              </h2>
              <div className="flex flex-col gap-5">
                {topics.map(({ topic, items: topicItems }) => (
                  <div key={topic}>
                    <h3 className="mb-2 flex items-center gap-2 font-medium" lang="de" dir="auto">
                      <span className="size-2 rounded-full bg-[var(--subject)]" aria-hidden />
                      {topic}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {topicItems.map((item) => (
                        <ContentCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
