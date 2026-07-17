import type { NextConfig } from "next";
import path from "node:path";

const insforgeHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_INSFORGE_URL
      ? new URL(process.env.NEXT_PUBLIC_INSFORGE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives inside a parent pnpm workspace; pin the tracing root to the
  // project dir so Next doesn't infer the monorepo root and bundle foreign chunks.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      ...(insforgeHost
        ? [
            {
              protocol: "https" as const,
              hostname: insforgeHost,
              pathname: "/**",
            },
          ]
        : []),
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
