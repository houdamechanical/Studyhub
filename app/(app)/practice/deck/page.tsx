"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loaded, NotFoundMessage } from "@/components/page-shell";
import { FlashcardSession, type StudyCard } from "@/components/practice/flashcard-session";
import { isUuid } from "@/lib/actions";
import { must, useLoad } from "@/lib/data";
import { useTitle } from "@/lib/i18n/client";
import type { SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";

// /practice/deck?id=…
export default function DeckPage() {
  return (
    <Suspense>
      <DeckLoader />
    </Suspense>
  );
}

type DeckRow = {
  id: string;
  subject: string;
  title: string;
  cards: { id: string; front: string; back: string; position: number }[];
};

async function loadDeck(id: string) {
  if (!isUuid(id)) return null;
  const supabase = createClient();
  const deck = must(
    await supabase.from("decks").select("id, subject, title, cards(id, front, back, position)").eq("id", id).maybeSingle(),
  ) as DeckRow | null;
  if (!deck) return null;
  const cardIds = deck.cards.map((c) => c.id);
  const reviews = cardIds.length
    ? must(await supabase.from("card_reviews").select("card_id, due_on").in("card_id", cardIds))
    : [];
  const due = new Map(reviews.map((r) => [r.card_id, r.due_on as string]));
  const cards: StudyCard[] = [...deck.cards]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, front: c.front, back: c.back, dueOn: due.get(c.id) ?? null }));
  return { deck: { id: deck.id, title: deck.title, subject: deck.subject as SubjectId }, cards };
}

function DeckLoader() {
  const id = useSearchParams().get("id") ?? "";
  // Loaded once per deck: the session keeps its own queue while you study.
  const state = useLoad(() => loadDeck(id), `deck:${id}`);
  useTitle(state.data?.deck.title);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
      <Loaded state={state}>
        {(data) => (data ? <FlashcardSession deck={data.deck} cards={data.cards} /> : <NotFoundMessage />)}
      </Loaded>
    </div>
  );
}
