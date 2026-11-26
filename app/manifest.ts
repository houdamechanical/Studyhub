import type { MetadataRoute } from "next";

// Lets people install Study Hub from the browser ("Add to Home Screen" on
// iPhone/iPad, "Install app" on Android/desktop) so it opens full-screen with
// its own icon. Paths need the base path (/Studyhub on GitHub Pages) by hand.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${base}/`,
    name: "Study Hub",
    short_name: "Study Hub",
    description: "Study pages, exams, grades and practice in one place.",
    start_url: `${base}/library/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
