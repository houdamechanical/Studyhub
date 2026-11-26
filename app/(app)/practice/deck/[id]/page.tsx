import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlashcardSession, type StudyCard } from "@/components/practice/flashcard-session";
import { SetupNotice } from "@/components/setup-notice";
import { isUuid } from "@/lib/actions";
import type { SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!hasEnvVars || !isUuid(id)) return {};
  const { data } = await (await createClient()).from("decks").select("title").eq("id", id).maybeSingle();
  return data ? { title: data.title } : {};
}

export default async function DeckPage({ params }: Props) {
  const { id } = await params;
  if (!hasEnvVars) return <SetupNotice problem="no-env" />;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const { data: deck } = await supabase
    .from("decks")
    .select("id, subject, title, cards(id, front, back, position)")
    .eq("id", id)
    .maybeSingle();
  if (!deck) notFound();

  const cardIds = deck.cards.map((c) => c.id);
  const { data: reviews } = cardIds.length
    ? await supabase.from("card_reviews").select("card_id, due_on").in("card_id", cardIds)
    : { data: [] };
  const due = new Map((reviews ?? []).map((r) => [r.card_id, r.due_on as string]));

  const cards: StudyCard[] = [...deck.cards]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, front: c.front, back: c.back, dueOn: due.get(c.id) ?? null }));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
      <FlashcardSession deck={{ id: deck.id, title: deck.title, subject: deck.subject as SubjectId }} cards={cards} />
    </div>
  );
}
