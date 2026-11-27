import { SubjectIcon } from "@/components/subject-icon";
import type { SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** Leather colour of each subject's book (distinct, muted, readable with cream foil). */
export const BOOK_COLORS: Record<SubjectId, string> = {
  math: "#2d4775",
  deutsch: "#7a2e2e",
  englisch: "#2c5d56",
  chemie: "#a4611f",
  physik: "#3b3f72",
  bio: "#3f6a39",
  geschichte: "#6a4a2c",
  religion: "#5b3a67",
  arabisch: "#1e5a68",
  kunst: "#a0442a",
  musik: "#4a2e5d",
  sport: "#8a3a52",
};

/**
 * A subject drawn as a book: leather cover in the subject's colour, a spine on
 * the left, page edges on the right, a cream foil frame with the icon and name.
 */
export function SubjectBook({
  subject,
  label,
  size = "md",
  className,
}: {
  subject: SubjectId;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const color = BOOK_COLORS[subject];
  return (
    <span
      className={cn("relative block aspect-[3/4] select-none", size === "sm" ? "w-14" : "w-full", className)}
      style={{ "--book": color } as React.CSSProperties}
      aria-hidden={!label}
    >
      {/* page block peeking out on the right */}
      <span className="absolute inset-y-[3%] end-0 w-[6%] rounded-e-sm bg-[repeating-linear-gradient(90deg,#efe7d6_0_1px,#d9cfbb_1px_2px)] shadow-[inset_0_0_2px_rgb(0_0_0/0.25)]" />
      {/* cover */}
      <span
        className="absolute inset-y-0 start-0 end-[4%] overflow-hidden rounded-e-md rounded-s-[3px] shadow-[0_10px_24px_-12px_rgb(0_0_0/0.55),0_2px_4px_rgb(0_0_0/0.18)]"
        style={{
          background:
            "linear-gradient(155deg, color-mix(in srgb, var(--book) 82%, white) 0%, var(--book) 38%, color-mix(in srgb, var(--book) 78%, black) 100%)",
        }}
      >
        {/* spine with a highlight and a crease */}
        <span className="absolute inset-y-0 start-0 w-[11%] bg-[linear-gradient(90deg,rgb(0_0_0/0.35),rgb(255_255_255/0.12)_45%,rgb(0_0_0/0.25))]" />
        {/* soft leather sheen */}
        <span className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_10%,rgb(255_255_255/0.14),transparent_55%)]" />
        {/* foil frame */}
        <span
          className={cn(
            "absolute inset-y-[7%] end-[8%] start-[18%] flex flex-col items-center justify-between rounded-[2px] border border-[#e9d9b5]/55 text-[#f3e6c8]",
            size === "sm" ? "py-1.5" : "px-1 py-[12%]",
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full border border-[#e9d9b5]/50",
              size === "sm" ? "size-6" : "aspect-square w-[46%]",
            )}
          >
            <SubjectIcon subject={subject} className={size === "sm" ? "size-3.5" : "size-[45%]"} strokeWidth={1.75} />
          </span>
          {label && size !== "sm" && (
            <span className="w-full truncate text-center text-[clamp(0.62rem,2.6vw,0.82rem)] font-semibold tracking-wide [text-shadow:0_1px_0_rgb(0_0_0/0.35)]">
              {label}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
