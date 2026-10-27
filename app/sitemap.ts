import type { MetadataRoute } from "next";
import { getGuides } from "@/lib/guides";
import { isTestPartnerSlug } from "@/lib/partner-slugs";
import { SITE_URL } from "@/lib/site";
import prisma from "@/lib/prisma";

const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/partners", priority: 0.8, changeFrequency: "monthly" },
  { path: "/partner/register", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/refund", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

// Regenerate hourly so newly approved partner pages appear without a redeploy.
export const revalidate = 3600;

export function staticSitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...PAGES,
    { path: "/guides", priority: 0.7, changeFrequency: "monthly" as const },
    ...getGuides().map((guide) => ({
      path: guide.path,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),
  ];
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticSitemap();
  try {
    const partners = await prisma.partnerProfile.findMany({
      where: { isApproved: true },
      select: { slug: true, updatedAt: true },
    });
    for (const p of partners) {
      // Keep QA profiles in the database, but do not advertise test pages.
      if (isTestPartnerSlug(p.slug)) continue;
      entries.push({
        url: `${SITE_URL}/partners/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
  } catch (err) {
    // Never fail the sitemap (or the build) because the database is unreachable.
    console.error("[sitemap] could not load partner pages", err);
  }
  return entries;
}
