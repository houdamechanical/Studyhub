"use client";

import { ExamsView } from "@/components/exams/exams-view";
import { Loaded, PageShell } from "@/components/page-shell";
import { must, useLoad } from "@/lib/data";
import type { Exam } from "@/lib/exams";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

export default function ExamsPage() {
  const { dict } = useI18n();
  const state = useLoad(
    async () =>
      must(
        await createClient()
          .from("exams")
          .select("id, subject, title, type, exam_date, start_time, room, status, notes")
          .order("exam_date"),
      ) as Exam[],
    "exams",
  );

  return (
    <PageShell title={dict.exams.title} subtitle={dict.exams.subtitle}>
      <Loaded state={state}>{(exams) => <ExamsView exams={exams} />}</Loaded>
    </PageShell>
  );
}
