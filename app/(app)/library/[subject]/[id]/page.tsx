import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentFrame } from "@/components/library/content-frame";
import { getContent } from "@/lib/content";
import { getI18n } from "@/lib/i18n/server";
import { SUBJECTS } from "@/lib/subjects";

type Props = { params: Promise<{ subject: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = getContent(id);
  return item ? { title: item.title } : {};
}

export default async function ContentViewerPage({ params }: Props) {
  const { subject, id } = await params;
  const item = getContent(id);
  if (!item || item.subject !== subject) notFound();

  const { locale } = await getI18n();

  return (
    <ContentFrame
      id={item.id}
      title={item.title}
      backHref={`/library/${item.subject}`}
      backLabel={SUBJECTS[item.subject].label[locale]}
    />
  );
}
