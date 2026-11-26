import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GradesView } from "@/components/grades/grades-view";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import { isScale, SCALE_COOKIE, type Grade } from "@/lib/grades";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.grades.title };
}

export default async function GradesPage() {
  const { dict } = await getI18n();
  const cookieScale = (await cookies()).get(SCALE_COOKIE)?.value;
  const scale = isScale(cookieScale) ? cookieScale : "grade";

  let content: React.ReactNode;
  if (!hasEnvVars) {
    content = <SetupNotice problem="no-env" />;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("grades")
      .select("id, subject, semester, title, scale, value, weight, graded_on")
      .order("graded_on");
    if (error) {
      console.error("load grades", error);
      content = <SetupNotice problem={isMissingTable(error) ? "no-table" : "error"} />;
    } else {
      // numeric columns can arrive as strings; normalise them.
      const grades = (data ?? []).map((g) => ({ ...g, value: Number(g.value), weight: Number(g.weight) })) as Grade[];
      content = <GradesView grades={grades} initialScale={scale} />;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.grades.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.grades.subtitle}</p>
      {content}
    </div>
  );
}
