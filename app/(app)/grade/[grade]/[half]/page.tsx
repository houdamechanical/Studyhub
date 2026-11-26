import { notFound } from "next/navigation";
import { SemesterView } from "@/components/school/semester-view";
import { HALVES, isHalf, isSchoolGrade, OPEN_GRADES, SCHOOL_GRADES } from "@/lib/school";

// Pre-built for every half-year (static site). Locked grades only get their grade page.
export const dynamicParams = false;
export function generateStaticParams() {
  return SCHOOL_GRADES.filter((g) => OPEN_GRADES.includes(g)).flatMap((grade) => HALVES.map((half) => ({ grade, half })));
}

export default async function SemesterPage({ params }: { params: Promise<{ grade: string; half: string }> }) {
  const { grade, half } = await params;
  if (!isSchoolGrade(grade) || !isHalf(half) || !OPEN_GRADES.includes(grade)) notFound();
  return <SemesterView semester={`${grade}.${half}`} />;
}
