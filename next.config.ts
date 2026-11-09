import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating "N Issues" dev indicator must never appear — the site
  // owners explicitly don't want any overlay badges (dev-only feature;
  // production builds never include it either way).
  devIndicators: false,
};

export default nextConfig;
