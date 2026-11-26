"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Static site: send visitors to the library (which sends signed-out users to login).
export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace("/library"), [router]);
  return null;
}
