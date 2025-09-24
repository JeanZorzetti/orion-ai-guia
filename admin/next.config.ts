import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment config
  images: {
    unoptimized: true,
  },
  // Force standalone output for Vercel
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
