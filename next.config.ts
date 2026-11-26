import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The study pages in /content are read from disk at request time by
  // app/api/content/[id]/route.ts. Make sure Vercel bundles them with that route.
  outputFileTracingIncludes: {
    "/api/content/*": ["./content/**/*.html"],
  },
};

export default nextConfig;
