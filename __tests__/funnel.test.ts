import { describe, expect, it } from "vitest";
import { classifySource, summarizeFunnel } from "@/lib/funnel";
import { giftInvitationContent } from "@/lib/emails/gift";
import robots from "@/app/robots";
import { staticSitemap as sitemap } from "@/app/sitemap";

describe("classifySource", () => {
  it("prefers utm_source over the referrer", () => {
    expect(classifySource({ utmSource: " Google_Ads ", referrer: "https://www.bing.com/" })).toBe("google_ads");
  });

  it("names search engines and AI assistants", () => {
    expect(classifySource({ referrer: "https://www.google.com/" })).toBe("google");
    expect(classifySource({ referrer: "https://www.google.co.uk/search" })).toBe("google");
    expect(classifySource({ referrer: "https://gemini.google.com/app" })).toBe("gemini");
    expect(classifySource({ referrer: "https://chatgpt.com/" })).toBe("chatgpt");
    expect(classifySource({ referrer: "https://copilot.microsoft.com/" })).toBe("copilot");
    expect(classifySource({ referrer: "https://www.perplexity.ai/" })).toBe("perplexity");
    expect(classifySource({ referrer: "https://l.facebook.com/" })).toBe("facebook");
  });

  it("returns direct, internal, or the bare host otherwise", () => {
    expect(classifySource({})).toBe("direct");
    expect(classifySource({ referrer: "not a url" })).toBe("direct");
    expect(
      classifySource({ referrer: "https://www.newhomewarrantyhq.com/about", ownHost: "newhomewarrantyhq.com" })
    ).toBe("internal");
    expect(classifySource({ referrer: "https://www.acmetitle.com/closing" })).toBe("acmetitle.com");
  });
});

describe("summarizeFunnel", () => {
  it("counts unique visitors under their first source and attributes checkouts and purchases", () => {
    const { totals, bySource } = summarizeFunnel({
      views: [
        { anonymousId: "a", properties: { path: "/", source: "google" } },
        { anonymousId: "a", properties: { path: "/about", source: "chatgpt" } },
        { anonymousId: "b", properties: { path: "/", source: "chatgpt" } },
        { anonymousId: "c", properties: { path: "/", source: "google" } },
        { anonymousId: null, properties: { path: "/", source: "google" } },
      ],
      checkouts: [
        { anonymousId: "a", properties: { productType: "HOMEOWNER", purchaseId: "p1", source: "google" } },
        { anonymousId: "a", properties: { productType: "HOMEOWNER", purchaseId: "p2", source: "google" } },
        { anonymousId: "z", properties: { productType: "GIFT", purchaseId: "g1", source: "direct" } },
      ],
      purchases: [
        { anonymousId: "a", properties: { productType: "HOMEOWNER", amount: 18900, source: "google" } },
        { anonymousId: "z", properties: { productType: "GIFT", amount: 12400, source: "direct" } },
      ],
    });

    const google = bySource.find((r) => r.source === "google")!;
    expect(google).toMatchObject({ visitors: 2, checkouts: 1, homeownerPurchases: 1, revenueCents: 18900 });
    expect(bySource.find((r) => r.source === "chatgpt")?.visitors).toBe(1);
    expect(totals).toMatchObject({
      visitors: 3,
      checkouts: 1,
      homeownerPurchases: 1,
      giftPurchases: 1,
      revenueCents: 31300,
    });
  });
});

describe("gift invitation", () => {
  it("names the partner's company and includes their message, escaped in HTML", () => {
    const email = giftInvitationContent({
      buyerName: "Jane Smith",
      buyerCompany: "Acme Title <Co>",
      giftMessage: "Congrats on the new home!",
      redemptionUrl: "https://newhomewarrantyhq.com/onboarding?token=t",
    });
    expect(email.subject).toBe("Jane Smith at Acme Title <Co> sent you a New Home Warranty HQ gift");
    expect(email.text).toContain('"Congrats on the new home!"');
    expect(email.html).toContain("Jane Smith at Acme Title &lt;Co&gt;");
    expect(email.html).toContain("Congrats on the new home!");
  });

  it("falls back to the partner's name with no message", () => {
    const email = giftInvitationContent({ buyerName: "Jane Smith", redemptionUrl: "https://x.test/o" });
    expect(email.subject).toBe("Jane Smith sent you a New Home Warranty HQ gift");
    expect(email.text).not.toContain("Their message");
  });
});

describe("robots and sitemap", () => {
  it("blocks everything outside production", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "preview";
    expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    process.env.VERCEL_ENV = prev;
  });

  it("keeps private areas out of search in production and lists the sitemap", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";
    const result = robots();
    process.env.VERCEL_ENV = prev;
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/dashboard", "/admin", "/checkout", "/onboarding"]));
    expect(result.sitemap).toBe("https://newhomewarrantyhq.com/sitemap.xml");
  });

  it("lists only public pages on the canonical domain", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://newhomewarrantyhq.com");
    expect(urls).toContain("https://newhomewarrantyhq.com/partners");
    expect(urls.every((u) => u.startsWith("https://newhomewarrantyhq.com"))).toBe(true);
    expect(urls.some((u) => /dashboard|admin|checkout|onboarding/.test(u))).toBe(false);
  });
});
