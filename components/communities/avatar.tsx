import { cn } from "@/lib/utils";

/** Initial in a tinted square; the tint comes from the name so each group keeps its colour. */
export function CommunityAvatar({ name, className }: { name: string; className?: string }) {
  const hue = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold uppercase", className)}
      style={{ background: `oklch(62% 0.12 ${hue} / 0.16)`, color: `oklch(62% 0.14 ${hue})` }}
    >
      {[...name.trim()][0] ?? "?"}
    </span>
  );
}
