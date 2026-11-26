import { Redirect } from "@/components/redirect";
import { semesterHref } from "@/lib/school";

// The library moved: subjects are now under Grade → half-year.
export default function LibraryPage() {
  return <Redirect to={semesterHref()} />;
}
