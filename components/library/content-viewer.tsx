"use client";

import { ContentFrame } from "@/components/library/content-frame";
import type { ContentItem } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { subjectHref } from "@/lib/school";
import { SUBJECTS } from "@/lib/subjects";

export function ContentViewer({ item }: { item: ContentItem }) {
  const { locale } = useI18n();
  return (
    <ContentFrame
      file={item.file}
      title={item.title}
      backHref={subjectHref(item.subject, item.semester)}
      backLabel={SUBJECTS[item.subject].label[locale]}
    />
  );
}
