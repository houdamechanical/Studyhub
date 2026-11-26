import { Redirect } from "@/components/redirect";
import { semesterHref } from "@/lib/school";

// Mini tests, mock exams and flashcards now live inside each subject.
export default function PracticePage() {
  return <Redirect to={semesterHref()} />;
}
