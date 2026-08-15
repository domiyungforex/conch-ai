import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://conchportal.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app surface has no SEO value (anonymous crawlers just hit the
      // sign-in redirect) and there's no reason to spend crawl budget on it or /api/.
      disallow: [
        "/api/",
        "/dashboard",
        "/chat",
        "/memory",
        "/agents",
        "/wallet",
        "/settings",
        "/reputation",
        "/shared",
        "/business",
        "/creators",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
