// Guarantee a valid absolute URL. A bare host, empty string, or malformed value
// would make `new URL()` throw at metadata eval time (500 on every route on CF).
function normalizeUrl(v: string | undefined): string | null {
  if (!v) return null;
  const withProto = /^https?:\/\//.test(v) ? v : `https://${v}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}

export const siteConfig = {
  name: "Jan Aushadhi Store",
  shortName: "Jan Aushadhi",
  description:
    "Buy affordable, quality-assured generic medicines online. Jan Aushadhi generic medicines store offering thousands of products at low prices.",
  url: normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) || "https://janaushadhi-nextjs.oriz.in",
  keywords: [
    "Jan Aushadhi",
    "generic medicines",
    "affordable medicines",
    "buy medicines online",
    "pharmacy",
    "PMBJP",
  ],
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com",
    github: "https://github.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
