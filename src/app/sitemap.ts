import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://conchportal.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/sign-in`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/sign-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    // Module landing surfaces — the pages new users land on after activating a
    // feature, so they belong in the crawlable index alongside the core pages.
    { url: `${BASE_URL}/business`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/creators`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
