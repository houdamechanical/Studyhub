"use client";

import { useId } from "react";
import { parseAvatar, useAdmins, type AvatarPreset } from "@/lib/people";
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
  userId,
}: {
  avatar: string | null | undefined;
  name: string;
  className?: string;
  /** No animation (small lists). */
  still?: boolean;
  /** Whose picture this is – admins get a crown on top. */
  userId?: string | null;
}) {
  const admins = useAdmins();
  const pic = <Picture avatar={avatar} name={name} className={className} still={still} />;
  if (!userId || !admins.has(userId)) return pic;
  return (
    <span className={cn("relative inline-flex shrink-0", className?.includes("size-full") && "size-full")}>
      {pic}
      <AdminCrown />
    </span>
  );
}

/** A gold crown sitting tilted on the top edge of the picture; scales with it. */
function AdminCrown() {
  return (
    <svg
      viewBox="0 0 32 22"
      aria-hidden
      className="pointer-events-none absolute start-1/2 top-0 w-[58%] -translate-x-1/2 -translate-y-[62%] -rotate-12 drop-shadow-[0_1px_1.5px_rgba(0,0,0,.35)] rtl:translate-x-1/2"
    >
      <defs>
        <linearGradient id="admin-crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="1" stopColor="#f0a020" />
        </linearGradient>
      </defs>
      <path d="M3 8 L9.5 13 L16 3 L22.5 13 L29 8 L27 19 H5 Z" fill="url(#admin-crown-gold)" stroke="#a8620a" strokeWidth="1.3" strokeLinejoin="round" />
      <rect x="5" y="16.5" width="22" height="3" rx="1" fill="#e08a12" />
      <circle cx="16" cy="3" r="2" fill="#ffe27a" stroke="#a8620a" strokeWidth="1" />
      <circle cx="3" cy="8" r="1.7" fill="#ffe27a" stroke="#a8620a" strokeWidth="1" />
      <circle cx="29" cy="8" r="1.7" fill="#ffe27a" stroke="#a8620a" strokeWidth="1" />
      <circle cx="16" cy="13" r="1.6" fill="#e11d48" />
    </svg>
  );
}

function Picture({ avatar, name, className, still }: { avatar: string | null | undefined; name: string; className?: string; still: boolean }) {
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

/** Background gradient per avatar (top-left → bottom-right). */
const BG: Record<AvatarPreset, [string, string]> = {
  shades: ["#12c2b0", "#1747c9"],
  cyber: ["#0b0f1a", "#2b3a5c"],
  astro: ["#0d1033", "#5021c4"],
  drip: ["#7c3aed", "#ec4899"],
  beats: ["#0f0c29", "#3b2f8f"],
  ninja: ["#ff3d5a", "#6d0bc0"],
  wolf: ["#070b1f", "#2c3e8f"],
  saturn: ["#ff8a1a", "#ff2d78"],
};

export const AVATAR_NAMES: Record<AvatarPreset, string> = {
  shades: "Shades",
  cyber: "Cyber",
  astro: "Astro",
  drip: "Drip",
  beats: "Beats",
  ninja: "Ninja",
  wolf: "Wolf",
  saturn: "Saturn",
};

const INK = "#14121a";

function Stars({ at }: { at: [number, number, number][] }) {
  return (
    <>
      {at.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" className="av-twinkle" />
      ))}
    </>
  );
}

function Note({ x, y, className }: { x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <ellipse cx={x} cy={y + 6} rx="2.4" ry="1.8" fill="#ffd34d" transform={`rotate(-20 ${x} ${y + 6})`} />
      <path d={`M${x + 2.1} ${y + 5.5} V${y - 2} l4 1.6`} stroke="#ffd34d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Face({ id, uid }: { id: AvatarPreset; uid: string }) {
  switch (id) {
    case "shades":
      return (
        <>
          <defs>
            <linearGradient id={`${uid}-lens`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a1036" />
              <stop offset="1" stopColor="#7b2ff7" />
            </linearGradient>
            <clipPath id={`${uid}-lc`}>
              <path d="M15 31 H30 V34 Q30 39.5 24 39.5 H20.5 Q15 39.5 15 34 Z M34 31 H49 V34 Q49 39.5 43.5 39.5 H40 Q34 39.5 34 34 Z" />
            </clipPath>
          </defs>
          <path d="M11 11 L24 25 L13 31 Z M53 11 L40 25 L51 31 Z" fill="#ff7a1a" />
          <path d="M14 16 L20 24 L15 27 Z M50 16 L44 24 L49 27 Z" fill="#2a1a10" />
          <ellipse cx="32" cy="38" rx="19.5" ry="16.5" fill="#ff7a1a" />
          <path d="M13 41 Q32 63 51 41 Q42 47.5 32 47.5 Q22 47.5 13 41 Z" fill="#fff4ea" />
          <rect x="13" y="29.5" width="38" height="3" rx="1.5" fill={INK} />
          <path d="M15 31 H30 V34 Q30 39.5 24 39.5 H20.5 Q15 39.5 15 34 Z M34 31 H49 V34 Q49 39.5 43.5 39.5 H40 Q34 39.5 34 34 Z" fill={`url(#${uid}-lens)`} stroke={INK} strokeWidth="1.4" />
          <g clipPath={`url(#${uid}-lc)`}>
            <path d="M18 44 L26 28 L29 28 L21 44 Z" fill="#fff" opacity=".55" className="av-glint" />
          </g>
          <ellipse cx="32" cy="43.5" rx="2.4" ry="1.8" fill={INK} />
          <path d="M28.5 48 Q32.5 50.5 37 47" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      );
    case "cyber":
      return (
        <>
          <defs>
            <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset=".5" stopColor="#00f0ff" stopOpacity=".55" />
              <stop offset="1" stopColor="#00f0ff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${uid}-vc`}>
              <rect x="15" y="27" width="34" height="11" rx="5.5" />
            </clipPath>
          </defs>
          <rect x="8" y="29" width="6" height="13" rx="2.5" fill="#3d4555" />
          <rect x="50" y="29" width="6" height="13" rx="2.5" fill="#3d4555" />
          <rect x="12" y="13" width="40" height="44" rx="17" fill="#2a303d" stroke="#46506a" strokeWidth="1.2" />
          <path d="M20 18 Q32 13 44 18" stroke="#5d6886" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="15" y="27" width="34" height="11" rx="5.5" fill="#04060b" />
          <g clipPath={`url(#${uid}-vc)`}>
            <g className="av-blink" style={{ transformOrigin: "32px 32.5px" }}>
              <rect x="21" y="30.5" width="7" height="4" rx="2" fill="#00f0ff" />
              <rect x="36" y="30.5" width="7" height="4" rx="2" fill="#00f0ff" />
            </g>
            <rect x="24" y="27" width="16" height="11" fill={`url(#${uid}-scan)`} className="av-scan" />
          </g>
          <path d="M26 46 H38 M27 49.5 H37" stroke="#56627c" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="44" cy="19" r="1.8" fill="#ff3d8a" className="av-pulse" />
        </>
      );
    case "astro":
      return (
        <>
          <defs>
            <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141a45" />
              <stop offset=".65" stopColor="#7b2ff7" />
              <stop offset="1" stopColor="#ff7a3d" />
            </linearGradient>
          </defs>
          <Stars at={[[10, 12, 1.1], [54, 9, 1.3], [8, 44, 0.9], [57, 30, 1], [50, 47, 0.8]]} />
          <path d="M9 64 Q11 50 32 50 Q53 50 55 64 Z" fill="#e9ecf2" />
          <rect x="27" y="51" width="10" height="6" rx="1.5" fill="#ff7a1a" />
          <circle cx="13.5" cy="33" r="3" fill="#c7ccd8" />
          <circle cx="50.5" cy="33" r="3" fill="#c7ccd8" />
          <circle cx="32" cy="32" r="18.5" fill="#f4f6fa" stroke="#c7ccd8" strokeWidth="1.5" />
          <ellipse cx="32" cy="33" rx="13.5" ry="11" fill={`url(#${uid}-visor)`} />
          <path d="M22 29 Q25 24.5 31 24" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".75" />
          <circle cx="39" cy="37" r="1" fill="#fff" className="av-twinkle" />
          <circle cx="35" cy="40" r=".7" fill="#fff" className="av-twinkle" />
        </>
      );
    case "drip":
      return (
        <>
          <circle cx="32" cy="30" r="17" fill="#ffe14d" />
          <rect x="21.5" y="38" width="4.5" height="13" rx="2.25" fill="#ffe14d" className="av-drip" />
          <rect x="37" y="41" width="4" height="9" rx="2" fill="#ffe14d" className="av-drip av-drip-2" />
          <rect x="30" y="44" width="3.5" height="7" rx="1.75" fill="#ffe14d" className="av-drip" />
          <g className="av-blink" style={{ transformOrigin: "32px 26px" }}>
            <ellipse cx="26" cy="26" rx="2.4" ry="4" fill={INK} />
            <ellipse cx="38" cy="26" rx="2.4" ry="4" fill={INK} />
          </g>
          <path d="M21.5 33 Q32 43 42.5 33" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      );
    case "beats":
      return (
        <>
          <Note x={50} y={11} className="av-float" />
          <Note x={10} y={15} className="av-float av-float-2" />
          <circle cx="32" cy="37" r="16" fill="#7cf5c8" />
          <path d="M13.5 36 Q13.5 15 32 15 Q50.5 15 50.5 36" stroke="#ff3d8a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="9" y="31" width="9" height="14" rx="4.5" fill="#ff3d8a" />
          <rect x="46" y="31" width="9" height="14" rx="4.5" fill="#ff3d8a" />
          <rect x="11" y="33.5" width="3" height="9" rx="1.5" fill="#ff8fbd" />
          <path d="M23 35 q3 2.6 6 0 M35 35 q3 2.6 6 0" stroke="#10362a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M27.5 42 q4.5 4 9 0" stroke="#10362a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
    case "ninja":
      return (
        <>
          <path d="M49 21 q9 -3 12 3 q-6 -1 -10 1.5 Z M49 23 q8 3 9 10 q-4 -5 -9.5 -6 Z" fill="#e11d48" />
          <circle cx="32" cy="35" r="19" fill="#16161d" />
          <rect x="13.5" y="20" width="37" height="5.5" rx="2" fill="#e11d48" />
          <rect x="28" y="20.5" width="8" height="4.5" rx="1" fill="#cbd5e1" />
          <rect x="16" y="29" width="32" height="10" rx="5" fill="#e8c4a0" />
          <g className="av-blink" style={{ transformOrigin: "32px 34px" }}>
            <ellipse cx="25" cy="34.5" rx="2.4" ry="2.2" fill={INK} />
            <ellipse cx="39" cy="34.5" rx="2.4" ry="2.2" fill={INK} />
          </g>
          <path d="M20 30.5 L29 32.8 M44 30.5 L35 32.8" stroke="#16161d" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "wolf":
      return (
        <>
          <circle cx="32" cy="30" r="23" fill="#fdf0c4" opacity=".14" />
          <Stars at={[[9, 14, 1], [55, 12, 1.2], [56, 44, 0.8]]} />
          <path d="M14 9 L23 25 L12 28 Z M50 9 L41 25 L52 28 Z" fill="#6b7280" />
          <path d="M15.5 14 L20 23.5 L15 25 Z M48.5 14 L44 23.5 L49 25 Z" fill="#374151" />
          <path d="M12 28 L22 22 L42 22 L52 28 L48 43 L32 57 L16 43 Z" fill="#9ca3af" />
          <path d="M22 22 L32 31 L42 22 Z" fill="#6b7280" />
          <path d="M12 28 L22 37 L16 43 Z M52 28 L42 37 L48 43 Z" fill="#7c8492" />
          <path d="M24 39 L32 34 L40 39 L32 57 Z" fill="#e5e7eb" />
          <path d="M29 49.5 L35 49.5 L32 53 Z" fill={INK} />
          <g className="av-blink" style={{ transformOrigin: "32px 34px" }}>
            <path d="M19 31.5 L28 34 L20.5 36 Z M45 31.5 L36 34 L43.5 36 Z" fill="#fbbf24" />
          </g>
        </>
      );
    case "saturn":
      return (
        <>
          <defs>
            <linearGradient id={`${uid}-pl`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff1c2" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <Stars at={[[11, 13, 1.1], [52, 52, 1], [8, 40, 0.8]]} />
          <ellipse cx="32" cy="34" rx="25" ry="6.5" transform="rotate(-18 32 34)" fill="none" stroke="#fff7ed" strokeWidth="3" opacity=".8" />
          <circle cx="32" cy="34" r="13" fill={`url(#${uid}-pl)`} />
          <path d="M20 30 Q32 33 44 29 M19.5 37 Q32 40 44.5 36" stroke="#d97706" strokeWidth="1.6" fill="none" opacity=".6" />
          <path d="M7 34 A25 6.5 0 0 0 57 34" transform="rotate(-18 32 34)" fill="none" stroke="#fff7ed" strokeWidth="3" strokeLinecap="round" />
          <g className="av-orbit">
            <circle cx="32" cy="7" r="2.6" fill="#fff" />
          </g>
        </>
      );
  }
}

export function AnimatedAvatar({ id, className, still = false }: { id: AvatarPreset; className?: string; still?: boolean }) {
  const uid = `av${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [from, to] = BG[id];
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} aria-hidden>
      <svg viewBox="0 0 64 64" className={cn("block size-full", !still && "av-anim")}>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${uid}-bg)`} />
        <g className="av-bob">
          <Face id={id} uid={uid} />
        </g>
      </svg>
    </span>
  );
}
