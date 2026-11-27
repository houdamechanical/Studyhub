import { AuthHero } from "@/components/auth/auth-hero";

/** Login, sign-up and password pages share the 3D bookshelf start screen. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthHero>{children}</AuthHero>;
}
