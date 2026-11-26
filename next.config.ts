import type { NextConfig } from "next";

// The app is exported as plain static files (no server), so it can be hosted on
// GitHub Pages. There it lives under https://<user>.github.io/Studyhub/, so the
// GitHub Actions build sets GITHUB_PAGES=true to add the /Studyhub prefix.
const basePath = process.env.GITHUB_PAGES === "true" ? "/Studyhub" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true, // /library/ → library/index.html, works on any static host
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
