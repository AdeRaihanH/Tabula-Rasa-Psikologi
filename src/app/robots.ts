import type { MetadataRoute } from "next";

const dasar = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tabularasa.id";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/masuk", "/api"],
      },
    ],
    sitemap: `${dasar}/sitemap.xml`,
  };
}
