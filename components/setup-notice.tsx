import { TriangleAlert } from "lucide-react";

export type SetupProblem = "no-env" | "no-table" | "error";

/** Is this Supabase error "the table doesn't exist" (migration not applied yet)? */
export function isMissingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

/** Developer-facing hint shown instead of a feature when the database isn't ready. */
export function SetupNotice({ problem }: { problem: SetupProblem }) {
  const text = {
    "no-env":
      "Supabase is not connected. Copy .env.example to .env.local and fill in your project URL and publishable key.",
    "no-table":
      "The database tables don't exist yet. Apply the SQL files in supabase/migrations (see README).",
    error: "Could not load data from Supabase. Check the server log for details.",
  }[problem];

  return (
    <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm" lang="en" dir="ltr">
      <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p>{text}</p>
    </div>
  );
}
