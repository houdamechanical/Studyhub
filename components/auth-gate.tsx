"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ElectivesOnboarding } from "@/components/electives";
import { AUTO_NICKNAME, NameOnboarding } from "@/components/name-onboarding";
import { FriendsStep, PictureStep } from "@/components/onboarding-steps";
import { isArtTeacher, setMyArtTeacher, type ArtTeacher } from "@/lib/exams";
import { isValidElectives, mySubjects, type SubjectId } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";

type Auth = {
  userId: string;
  isAdmin: boolean;
  /** Public name (profiles.nickname), shown on leaderboards and the home page. */
  nickname: string;
  setNickname: (name: string) => void;
  /** Art/Music + two of Biology/Chemistry/Arabic; null = not chosen (or not set up yet). */
  electives: SubjectId[] | null;
  /** Kangas (kng) or McCombie (mcm) for Art students; null otherwise. */
  artTeacher: ArtTeacher | null;
  /** Profile picture: 'a:<preset>' | 'u:<url>' | null (see lib/people). */
  avatar: string | null;
  setAvatar: (value: string | null) => void;
  setElectives: (list: SubjectId[], artTeacher: ArtTeacher | null) => void;
  /** The subjects this student takes (all of them until they choose). */
  subjects: SubjectId[];
};
type AuthState = Omit<Auth, "setNickname" | "setElectives" | "subjects" | "setAvatar"> & {
  /** The profiles table has the electives column (migration applied). */
  canChoose: boolean;
  /** The profiles table has the art_teacher column (migration applied). */
  canPickTeacher: boolean;
};
const noop = () => {};
const AuthContext = createContext<Auth>({
  userId: "",
  isAdmin: false,
  nickname: "",
  setNickname: noop,
  electives: null,
  artTeacher: null,
  avatar: null,
  setAvatar: noop,
  setElectives: noop,
  subjects: [],
});

/** Signed-in user (inside <AuthGate>). */
export const useAuth = () => useContext(AuthContext);

/**
 * The site is static, so sign-in is checked in the browser: signed-out visitors
 * are sent to the login page. (The data itself is protected by Row Level
 * Security in the database, not by this redirect.)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(
    hasEnvVars ? null : { userId: "", isAdmin: false, nickname: "", electives: null, artTeacher: null, avatar: null, canChoose: false, canPickTeacher: false },
  );

  // First run (no subjects chosen yet): picture → friends → subjects.
  const [firstRun, setFirstRun] = useState<"picture" | "friends" | "subjects">("picture");

  useEffect(() => {
    if (!hasEnvVars) return;
    const supabase = createClient();
    let alive = true;

    async function apply(userId: string | undefined) {
      if (!alive) return;
      if (!userId) {
        setAuth(null);
        router.replace("/");
        return;
      }
      // Both fail harmlessly if the migrations aren't applied yet.
      const [admin, profile, teacherRow] = await Promise.all([
        supabase.rpc("is_admin"),
        supabase.from("profiles").select("nickname, electives").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("art_teacher").eq("user_id", userId).maybeSingle(),
      ]);
      // Profile picture (fails harmlessly before the avatars migration).
      const avatarRow = await supabase.from("profiles").select("avatar").eq("user_id", userId).maybeSingle();
      const avatar = avatarRow.error ? null : ((avatarRow.data as { avatar: string | null } | null)?.avatar ?? null);
      // Before the art teacher migration this select fails: no teacher question then.
      const canPickTeacher = !teacherRow.error;
      const rawTeacher = (teacherRow.data as { art_teacher: string | null } | null)?.art_teacher;
      const artTeacher = isArtTeacher(rawTeacher) ? rawTeacher : null;
      // Before the electives migration the select fails: fall back to the name alone.
      const canChoose = !profile.error;
      const row = canChoose
        ? (profile.data as { nickname: string; electives: string[] | null } | null)
        : ((await supabase.from("profiles").select("nickname").eq("user_id", userId).maybeSingle()).data as {
            nickname: string;
          } | null);
      const nickname = row?.nickname ?? "";
      const raw = row && "electives" in row ? (row.electives as string[] | null) : null;
      const electives = isValidElectives(raw) ? raw : null;
      if (alive)
        setAuth({
          userId,
          isAdmin: admin.data === true,
          nickname,
          electives,
          artTeacher,
          avatar,
          canChoose: canChoose && Boolean(row),
          canPickTeacher,
        });
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") apply(session?.user.id);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!auth) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground" aria-busy>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }
  const setNickname = (nickname: string) => setAuth((a) => (a ? { ...a, nickname } : a));
  const setElectives = (electives: SubjectId[], artTeacher: ArtTeacher | null) =>
    setAuth((a) => (a ? { ...a, electives, artTeacher } : a));
  // New accounts get a generated name ("Student-k3f9a"): ask for a real one first.
  // (No profiles table yet → empty nickname → skip, the app still works.)
  if (hasEnvVars && AUTO_NICKNAME.test(auth.nickname)) {
    return <NameOnboarding onDone={setNickname} />;
  }
  // Then, once: which subjects do you take?
  // Art students also say who their teacher is (only that teacher's Art exams count).
  const needsTeacher = auth.canPickTeacher && auth.electives?.includes("kunst") && !auth.artTeacher;
  const setAvatar = (value: string | null) => setAuth((a) => (a ? { ...a, avatar: value } : a));
  // A brand-new account (no subjects yet) first picks a picture and finds friends.
  if (hasEnvVars && auth.canChoose && !auth.electives && firstRun === "picture") {
    return <PictureStep userId={auth.userId} nickname={auth.nickname} avatar={auth.avatar} onAvatar={setAvatar} onDone={() => setFirstRun("friends")} />;
  }
  if (hasEnvVars && auth.canChoose && !auth.electives && firstRun === "friends") {
    return <FriendsStep userId={auth.userId} onDone={() => setFirstRun("subjects")} />;
  }
  if (hasEnvVars && auth.canChoose && (!auth.electives || needsTeacher)) {
    return <ElectivesOnboarding initial={auth.electives} initialTeacher={auth.artTeacher} onDone={setElectives} step={!auth.electives ? 4 : undefined} />;
  }
  const { userId, isAdmin, nickname, electives, artTeacher, avatar } = auth;
  setMyArtTeacher(artTeacher);
  return (
    <AuthContext.Provider
      value={{ userId, isAdmin, nickname, electives, artTeacher, avatar, setAvatar, setNickname, setElectives, subjects: mySubjects(electives) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
