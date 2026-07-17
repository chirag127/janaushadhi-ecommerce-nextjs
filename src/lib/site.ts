export const siteConfig = {
  name: "Jan Aushadhi Store",
  shortName: "Jan Aushadhi",
  description:
    "Buy affordable, quality-assured generic medicines online. Jan Aushadhi generic medicines store offering thousands of products at low prices.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
