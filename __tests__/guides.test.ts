import { describe, expect, it } from "vitest";
import { staticSitemap } from "@/app/sitemap";
import { getGuides, guideInternalLinks } from "@/lib/guides";
import { parseMarkdown } from "@/lib/markdown";
import { isTestPartnerSlug } from "@/lib/partner-slugs";

const EXPECTED_SLUGS = [
  "11-month-warranty-inspection",
  "builder-warranty-vs-home-warranty",
  "how-long-is-a-builder-warranty",
  "builder-not-fixing-warranty-items",
  "builder-warranty-expiring",
  "11-month-checklist",
  "builder-warranty-letters",
];

describe("guides", () => {
  const guides = getGuides();

  it("publishes the five guides and both lead magnets", () => {
    expect(guides.map((guide) => guide.slug)).toEqual(EXPECTED_SLUGS);
    for (const guide of guides) {
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.description.length).toBeGreaterThan(0);
      expect(guide.path).toBe(`/guides/${guide.slug}`);
      expect(guide.body.toLowerCase()).toContain("legal advice");
    }
  });

  it("strips internal draft fields and does not invent pages", () => {
    const published = new Set(guides.map((guide) => guide.path));
    published.add("/guides");
    for (const guide of guides) {
      expect(guide.body).not.toMatch(/target_query|review_flags|lead_magnet_|Publish notes|READY TO APPROVE|Not published/i);
      for (const link of guideInternalLinks(guide)) {
        const pathOnly = link.href.split("?")[0];
        expect(published.has(pathOnly), `${guide.slug} links to missing ${link.href}`).toBe(true);
      }
    }
  });

  it("keeps the checklist tasks and the comparison table", () => {
    const checklist = guides.find((guide) => guide.slug === "11-month-checklist")!;
    const tasks = parseMarkdown(checklist.body).filter((block) => block.type === "ul");
    expect(tasks.some((block) => block.type === "ul" && block.items.some((item) => item.checked === false))).toBe(true);

    const comparison = guides.find((guide) => guide.slug === "builder-warranty-vs-home-warranty")!;
    const table = parseMarkdown(comparison.body).find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (table?.type === "table") {
      expect(table.headers).toContain("Builder warranty");
      expect(table.rows.length).toBeGreaterThan(0);
    }
  });

  it("lists every guide on the sitemap and leaves the QA partner page off it", () => {
    const urls = staticSitemap().map((entry) => entry.url);
    expect(urls).toContain("https://newhomewarrantyhq.com/guides");
    for (const slug of EXPECTED_SLUGS) {
      expect(urls).toContain(`https://newhomewarrantyhq.com/guides/${slug}`);
    }
    expect(urls).not.toContain("https://newhomewarrantyhq.com/partners/qa-test-company");
  });
});

describe("isTestPartnerSlug", () => {
  it("excludes QA fixtures and keeps ordinary company slugs", () => {
    expect(isTestPartnerSlug("qa-test-company")).toBe(true);
    expect(isTestPartnerSlug("QA-Test-Company")).toBe(true);
    expect(isTestPartnerSlug("test-company")).toBe(true);
    expect(isTestPartnerSlug("qa-test")).toBe(true);
    expect(isTestPartnerSlug("partner-test-page")).toBe(true);
    expect(isTestPartnerSlug("acme-title")).toBe(false);
    expect(isTestPartnerSlug("contest-homes")).toBe(false);
  });
});
