import type { Metadata } from "next";
import { ExamsView } from "@/components/exams/exams-view";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import type { Exam } from "@/lib/exams";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.exams.title };
}

export default async function ExamsPage() {
  const { dict } = await getI18n();

  let content: React.ReactNode;
  if (!hasEnvVars) {
    content = <SetupNotice problem="no-env" />;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exams")
      .select("id, subject, title, type, exam_date, start_time, room, status, notes")
      .order("exam_date");
    if (error) {
      console.error("load exams", error);
      content = <SetupNotice problem={isMissingTable(error) ? "no-table" : "error"} />;
    } else {
      content = <ExamsView exams={data as Exam[]} />;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.exams.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.exams.subtitle}</p>
      {content}
    </div>
  );
}
