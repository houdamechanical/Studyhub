import { notFound } from "next/navigation";
import { Redirect } from "@/components/redirect";
import { subjectHref } from "@/lib/school";
import { isSubjectId, SUBJECT_IDS } from "@/lib/subjects";

// Old address of a subject: now /grade/<grade>/<half>/<subject> (current half-year).
export const dynamicParams = false;
export function generateStaticParams() {
  return SUBJECT_IDS.map((subject) => ({ subject }));
}

export default async function SubjectRedirect({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!isSubjectId(subject)) notFound();
  return <Redirect to={subjectHref(subject)} />;
}
