"use client";

import { parseAvatar, type AvatarPreset } from "@/lib/people";
import { cn } from "@/lib/utils";

/**
 * A student's picture: an animated character, an uploaded photo, or the first
 * letter of their name. Size comes from the className (e.g. size-9).
 */
export function UserAvatar({
  avatar,
  name,
  className,
  still = false,
}: {
  avatar: string | null | undefined;
  name: string;
  className?: string;
  /** No animation (small lists). */
  still?: boolean;
}) {
  const a = parseAvatar(avatar);
  if (a?.kind === "photo") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.url} alt="" className={cn("shrink-0 rounded-full object-cover", className)} loading="lazy" />;
  }
  if (a?.kind === "preset") return <AnimatedAvatar id={a.id} className={className} still={still} />;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--c-pill)] font-display font-semibold uppercase text-foreground",
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

const BG: Record<AvatarPreset, string> = {
  fuchs: "#ffe2c7",
  katze: "#e6e1f5",
  panda: "#dff0e3",
  frosch: "#d9f2ff",
  eule: "#f7ecd5",
  roboter: "#dde6f3",
  pinguin: "#d6ecf7",
  alien: "#eadcff",
};

export const AVATAR_NAMES: Record<AvatarPreset, string> = {
  fuchs: "Fuchs",
  katze: "Katze",
  panda: "Panda",
  frosch: "Frosch",
  eule: "Eule",
  roboter: "Roboter",
  pinguin: "Pinguin",
  alien: "Alien",
};

/** Two eyes that blink together. */
function Eyes({ x1 = 24, x2 = 40, y = 34, r = 3.2, color = "#1f1b16" }) {
  return (
    <g className="av-blink" style={{ transformOrigin: `32px ${y}px` }}>
      <circle cx={x1} cy={y} r={r} fill={color} />
      <circle cx={x2} cy={y} r={r} fill={color} />
      <circle cx={x1 + 1} cy={y - 1.2} r={r * 0.35} fill="#fff" />
      <circle cx={x2 + 1} cy={y - 1.2} r={r * 0.35} fill="#fff" />
    </g>
  );
}

const Smile = ({ y = 42, color = "#1f1b16" }) => (
  <path d={`M28 ${y} q4 3.5 8 0`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
);

function Face({ id }: { id: AvatarPreset }) {
  switch (id) {
    case "fuchs":
      return (
        <>
          <path d="M12 14 L22 26 L14 30 Z M52 14 L42 26 L50 30 Z" fill="#f07c2b" />
          <path d="M14 18 L19 25 L15 27 Z M50 18 L45 25 L49 27 Z" fill="#3a2414" />
          <ellipse cx="32" cy="37" rx="19" ry="17" fill="#f07c2b" />
          <path d="M14 40 Q32 62 50 40 Q42 46 32 46 Q22 46 14 40 Z" fill="#fff4ea" />
          <Eyes />
          <ellipse cx="32" cy="41" rx="2.6" ry="2" fill="#1f1b16" />
        </>
      );
    case "katze":
      return (
        <>
          <path d="M14 14 L24 24 L14 30 Z M50 14 L40 24 L50 30 Z" fill="#8c8aa8" />
          <ellipse cx="32" cy="37" rx="19" ry="17" fill="#a6a4c2" />
          <Eyes />
          <path d="M30 40 L34 40 L32 42.5 Z" fill="#e0738a" />
          <path d="M14 40 L24 41 M14 44 L24 43 M50 40 L40 41 M50 44 L40 43" stroke="#5c5a74" strokeWidth="1.3" strokeLinecap="round" />
          <Smile y={43} />
        </>
      );
    case "panda":
      return (
        <>
          <circle cx="16" cy="20" r="7" fill="#2b2b2b" />
          <circle cx="48" cy="20" r="7" fill="#2b2b2b" />
          <ellipse cx="32" cy="37" rx="19" ry="17" fill="#fbfbf8" />
          <ellipse cx="24" cy="34" rx="5.5" ry="6.5" fill="#2b2b2b" transform="rotate(-20 24 34)" />
          <ellipse cx="40" cy="34" rx="5.5" ry="6.5" fill="#2b2b2b" transform="rotate(20 40 34)" />
          <Eyes r={2.4} color="#fbfbf8" />
          <ellipse cx="32" cy="41" rx="2.6" ry="1.8" fill="#2b2b2b" />
          <Smile y={44} />
        </>
      );
    case "frosch":
      return (
        <>
          <circle cx="22" cy="22" r="8" fill="#4caf50" />
          <circle cx="42" cy="22" r="8" fill="#4caf50" />
          <ellipse cx="32" cy="38" rx="21" ry="15" fill="#5cc062" />
          <circle cx="22" cy="22" r="4.6" fill="#fff" />
          <circle cx="42" cy="22" r="4.6" fill="#fff" />
          <Eyes x1={22} x2={42} y={22} r={2.6} />
          <path d="M22 41 q10 7 20 0" stroke="#1f5d22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="18" cy="40" r="2.4" fill="#f59fb0" opacity=".7" />
          <circle cx="46" cy="40" r="2.4" fill="#f59fb0" opacity=".7" />
        </>
      );
    case "eule":
      return (
        <>
          <path d="M14 16 L24 24 L16 28 Z M50 16 L40 24 L48 28 Z" fill="#8a5a2b" />
          <ellipse cx="32" cy="37" rx="19" ry="18" fill="#a8743e" />
          <circle cx="24" cy="34" r="7.5" fill="#fff6e6" />
          <circle cx="40" cy="34" r="7.5" fill="#fff6e6" />
          <Eyes r={3.6} />
          <path d="M29.5 40 L34.5 40 L32 45 Z" fill="#f0a13a" />
        </>
      );
    case "roboter":
      return (
        <>
          <line x1="32" y1="10" x2="32" y2="18" stroke="#5b6b82" strokeWidth="2.2" />
          <circle cx="32" cy="9" r="3" fill="#ff7a1a" className="av-pulse" />
          <rect x="13" y="18" width="38" height="34" rx="9" fill="#8fa3bd" />
          <rect x="18" y="26" width="28" height="14" rx="6" fill="#203047" />
          <Eyes y={33} r={2.6} color="#7cf2ff" />
          <rect x="25" y="44" width="14" height="3" rx="1.5" fill="#203047" />
          <rect x="9" y="30" width="4" height="10" rx="2" fill="#5b6b82" />
          <rect x="51" y="30" width="4" height="10" rx="2" fill="#5b6b82" />
        </>
      );
    case "pinguin":
      return (
        <>
          <ellipse cx="32" cy="36" rx="20" ry="19" fill="#22303d" />
          <path d="M16 38 Q16 24 26 24 Q32 28 38 24 Q48 24 48 38 Q48 52 32 52 Q16 52 16 38 Z" fill="#fbfbf8" />
          <Eyes y={33} r={2.8} />
          <path d="M28 39 L36 39 L32 44 Z" fill="#f5a623" />
          <circle cx="21" cy="41" r="2.4" fill="#f59fb0" opacity=".6" />
          <circle cx="43" cy="41" r="2.4" fill="#f59fb0" opacity=".6" />
        </>
      );
    case "alien":
      return (
        <>
          <line x1="22" y1="16" x2="18" y2="8" stroke="#7b4fd6" strokeWidth="2" />
          <line x1="42" y1="16" x2="46" y2="8" stroke="#7b4fd6" strokeWidth="2" />
          <circle cx="18" cy="8" r="2.6" fill="#ffd34d" className="av-pulse" />
          <circle cx="46" cy="8" r="2.6" fill="#ffd34d" className="av-pulse" />
          <ellipse cx="32" cy="35" rx="19" ry="19" fill="#9b6cf0" />
          <ellipse cx="32" cy="32" rx="9" ry="8" fill="#fff" />
          <g className="av-blink" style={{ transformOrigin: "32px 32px" }}>
            <circle cx="32" cy="32" r="4.6" fill="#1f1b16" />
            <circle cx="33.6" cy="30.4" r="1.4" fill="#fff" />
          </g>
          <Smile y={44} />
        </>
      );
  }
}

export function AnimatedAvatar({ id, className, still = false }: { id: AvatarPreset; className?: string; still?: boolean }) {
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} style={{ background: BG[id] }} aria-hidden>
      <svg viewBox="0 0 64 64" className={cn("block size-full", !still && "av-anim")}>
        <g className="av-bob">
          <Face id={id} />
        </g>
      </svg>
    </span>
  );
}
