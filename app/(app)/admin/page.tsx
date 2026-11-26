"use client";

import { AdminPanel, type AdminData } from "@/components/admin/admin-panel";
import { useAuth } from "@/components/auth-gate";
import { Loaded, NotFoundMessage, PageShell } from "@/components/page-shell";
import { must, useLoad } from "@/lib/data";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

async function loadAdmin(): Promise<AdminData> {
  const supabase = createClient();
  const [questions, quizzes, decks] = await Promise.all([
    supabase.from("questions").select("id, key, subject, topic, type, prompt").order("created_at", { ascending: false }),
    supabase.from("quizzes").select("id, kind, subject, title, quiz_questions(count)").order("title"),
    supabase.from("decks").select("id, subject, title, cards(count)").order("title"),
  ]);
  return {
    questions: must(questions) as AdminData["questions"],
    quizzes: must(quizzes).map((q) => ({
      id: q.id,
      kind: q.kind,
      subject: q.subject,
      title: q.title,
      count: (q.quiz_questions as unknown as { count: number }[])[0]?.count ?? 0,
    })),
    decks: must(decks).map((d) => ({
      id: d.id,
      subject: d.subject,
      title: d.title,
      count: (d.cards as unknown as { count: number }[])[0]?.count ?? 0,
    })),
  };
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  // Hiding the page is only cosmetic: the database rejects writes from non-admins.
  if (!isAdmin) return <NotFoundMessage />;
  return <AdminContent />;
}

function AdminContent() {
  const { dict } = useI18n();
  const state = useLoad(loadAdmin, "admin");
  return (
    <PageShell title={dict.admin.title} subtitle={dict.admin.subtitle}>
      <Loaded state={state}>{(data) => <AdminPanel data={data} />}</Loaded>
    </PageShell>
  );
}
