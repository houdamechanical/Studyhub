import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPanel, type AdminData } from "@/components/admin/admin-panel";
import { isMissingTable, SetupNotice } from "@/components/setup-notice";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.admin.title };
}

export default async function AdminPage() {
  if (!hasEnvVars) return <SetupNotice problem="no-env" />;
  const { dict } = await getI18n();
  const supabase = await createClient();

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <SetupNotice problem={isMissingTable(adminError) || adminError.code === "PGRST202" ? "no-table" : "error"} />
      </div>
    );
  }
  // Non-admins don't learn that this page exists.
  if (!isAdmin) notFound();

  const [questions, quizzes, decks] = await Promise.all([
    supabase.from("questions").select("id, key, subject, topic, type, prompt").order("created_at", { ascending: false }),
    supabase.from("quizzes").select("id, kind, subject, title, quiz_questions(count)").order("title"),
    supabase.from("decks").select("id, subject, title, cards(count)").order("title"),
  ]);

  const data: AdminData = {
    questions: questions.data ?? [],
    quizzes: (quizzes.data ?? []).map((q) => ({
      id: q.id,
      kind: q.kind,
      subject: q.subject,
      title: q.title,
      count: (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0,
    })),
    decks: (decks.data ?? []).map((d) => ({
      id: d.id,
      subject: d.subject,
      title: d.title,
      count: (d.cards as unknown as { count: number }[])[0]?.count ?? 0,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.admin.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{dict.admin.subtitle}</p>
      <AdminPanel data={data} />
    </div>
  );
}
