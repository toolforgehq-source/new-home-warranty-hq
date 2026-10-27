import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // The sitemap reads guide markdown at runtime. Trace those files into that route.
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./content/guides/**/*.md"],
  },
};

export default nextConfig;
