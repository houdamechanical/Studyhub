import { notFound } from "next/navigation";
import { GradeView } from "@/components/school/grade-view";
import { isSchoolGrade, SCHOOL_GRADES } from "@/lib/school";

// Pre-built for every grade (static site).
export const dynamicParams = false;
export function generateStaticParams() {
  return SCHOOL_GRADES.map((grade) => ({ grade }));
}

export default async function GradePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade } = await params;
  if (!isSchoolGrade(grade)) notFound();
  return <GradeView grade={grade} />;
}
