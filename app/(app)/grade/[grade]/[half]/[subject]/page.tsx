import { notFound } from "next/navigation";
import { SubjectPage } from "@/components/school/subject-page";
import { HALVES, isHalf, isSchoolGrade, OPEN_GRADES, SCHOOL_GRADES } from "@/lib/school";
import { isSubjectId, SUBJECT_IDS } from "@/lib/subjects";

// Pre-built for every subject of every open half-year (static site).
export const dynamicParams = false;
export function generateStaticParams() {
  return SCHOOL_GRADES.filter((g) => OPEN_GRADES.includes(g)).flatMap((grade) =>
    HALVES.flatMap((half) => SUBJECT_IDS.map((subject) => ({ grade, half, subject }))),
  );
}

export default async function SubjectRoute({
  params,
}: {
  params: Promise<{ grade: string; half: string; subject: string }>;
}) {
  const { grade, half, subject } = await params;
  if (!isSchoolGrade(grade) || !isHalf(half) || !OPEN_GRADES.includes(grade) || !isSubjectId(subject)) notFound();
  return <SubjectPage semester={`${grade}.${half}`} subject={subject} />;
}
