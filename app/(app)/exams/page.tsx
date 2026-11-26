import { Redirect } from "@/components/redirect";

// Exams are now a tab of "Grades & Exams".
export default function ExamsPage() {
  return <Redirect to="/grades?tab=exams" />;
}
