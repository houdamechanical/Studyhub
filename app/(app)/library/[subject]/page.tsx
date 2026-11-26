import { notFound } from "next/navigation";
import { SubjectView } from "@/components/library/subject-view";
import { isSubjectId, SUBJECT_IDS } from "@/lib/subjects";

// Pre-built for every subject (static site).
export const dynamicParams = false;
export function generateStaticParams() {
  return SUBJECT_IDS.map((subject) => ({ subject }));
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();
  return <SubjectView subject={subject} />;
}
