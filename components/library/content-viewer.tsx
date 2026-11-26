"use client";

import { ContentFrame } from "@/components/library/content-frame";
import type { ContentItem } from "@/lib/content";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECTS } from "@/lib/subjects";

export function ContentViewer({ item }: { item: ContentItem }) {
  const { locale } = useI18n();
  return (
    <ContentFrame
      file={item.file}
      title={item.title}
      backHref={`/library/${item.subject}`}
      backLabel={SUBJECTS[item.subject].label[locale]}
    />
  );
}
