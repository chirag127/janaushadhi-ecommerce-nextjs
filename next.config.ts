import type { NextConfig } from "next";

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
