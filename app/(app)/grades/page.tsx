"use client";

import { GradesView } from "@/components/grades/grades-view";
import { Loaded, PageShell } from "@/components/page-shell";
import { must, useLoad } from "@/lib/data";
import type { Grade } from "@/lib/grades";
import { useI18n } from "@/lib/i18n/client";
import { getDisplayScale } from "@/lib/mutations/grades";
import { createClient } from "@/lib/supabase/client";

export default function GradesPage() {
  const { dict } = useI18n();
  const state = useLoad(async () => {
    const rows = must(
      await createClient()
        .from("grades")
        .select("id, subject, semester, title, scale, value, weight, graded_on")
        .order("graded_on"),
    ) as Grade[];
    // numeric columns can arrive as strings; normalise them.
    const grades = rows.map((g) => ({ ...g, value: Number(g.value), weight: Number(g.weight) }));
    return { grades, scale: getDisplayScale() };
  }, "grades");

  return (
    <PageShell title={dict.grades.title} subtitle={dict.grades.subtitle}>
      <Loaded state={state}>{({ grades, scale }) => <GradesView grades={grades} initialScale={scale} />}</Loaded>
    </PageShell>
  );
}
