export const VISITOR_COOKIE = "nhw_aid";
export const SOURCE_COOKIE = "nhw_src";

export const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|curl|wget|python-requests/i;

const KNOWN_HOSTS: [RegExp, string][] = [
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)gemini\.google\.com$/, "gemini"],
  [/(^|\.)copilot\.microsoft\.com$/, "copilot"],
  [/(^|\.)claude\.ai$/, "claude"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yahoo\.com$/, "yahoo"],
  [/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/, "facebook"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)nextdoor\.com$/, "nextdoor"],
];

export const daysAgo = (days: number, now = new Date()) => new Date(now.getTime() - days * 86400000);

const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, "");

/** Where a visit came from: utm_source wins, then the referring site; "internal" means our own pages. */
export function classifySource({
  referrer,
  utmSource,
  ownHost,
}: {
  referrer?: string | null;
  utmSource?: string | null;
  ownHost?: string;
}): string {
  if (utmSource?.trim()) return utmSource.trim().toLowerCase().slice(0, 40);
  if (!referrer) return "direct";
  let host: string;
  try {
    host = bareHost(new URL(referrer).hostname);
  } catch {
    return "direct";
  }
  if (!host) return "direct";
  if (ownHost && host === bareHost(ownHost)) return "internal";
  for (const [pattern, name] of KNOWN_HOSTS) {
    if (pattern.test(host)) return name;
  }
  return host.slice(0, 60);
}

type FunnelEvent = { anonymousId: string | null; properties: unknown };

export type FunnelRow = {
  source: string;
  visitors: number;
  checkouts: number;
  homeownerPurchases: number;
  giftPurchases: number;
  revenueCents: number;
};

function prop(e: FunnelEvent, key: string): unknown {
  const p = e.properties;
  return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>)[key] : undefined;
}

const emptyRow = (source: string): FunnelRow => ({
  source,
  visitors: 0,
  checkouts: 0,
  homeownerPurchases: 0,
  giftPurchases: 0,
  revenueCents: 0,
});

/** Visitors are counted once, under the source of their first view in the range (views must be oldest first). */
export function summarizeFunnel({
  views,
  checkouts,
  purchases,
}: {
  views: FunnelEvent[];
  checkouts: FunnelEvent[];
  purchases: FunnelEvent[];
}): { totals: FunnelRow; bySource: FunnelRow[] } {
  const rows = new Map<string, FunnelRow>();
  const row = (source: unknown) => {
    const key = typeof source === "string" && source ? source : "unknown";
    if (!rows.has(key)) rows.set(key, emptyRow(key));
    return rows.get(key)!;
  };

  const seenVisitors = new Set<string>();
  for (const v of views) {
    if (!v.anonymousId || seenVisitors.has(v.anonymousId)) continue;
    seenVisitors.add(v.anonymousId);
    row(prop(v, "source")).visitors++;
  }

  const seenCheckouts = new Set<string>();
  for (const c of checkouts) {
    if (prop(c, "productType") !== "HOMEOWNER") continue;
    const key = c.anonymousId ?? String(prop(c, "purchaseId"));
    if (seenCheckouts.has(key)) continue;
    seenCheckouts.add(key);
    row(prop(c, "source")).checkouts++;
  }

  for (const p of purchases) {
    const r = row(prop(p, "source"));
    if (prop(p, "productType") === "GIFT") r.giftPurchases++;
    else r.homeownerPurchases++;
    const amount = prop(p, "amount");
    if (typeof amount === "number") r.revenueCents += amount;
  }

  const bySource = [...rows.values()].sort(
    (a, b) => b.visitors - a.visitors || b.homeownerPurchases - a.homeownerPurchases
  );
  const totals = bySource.reduce((t, r) => {
    t.visitors += r.visitors;
    t.checkouts += r.checkouts;
    t.homeownerPurchases += r.homeownerPurchases;
    t.giftPurchases += r.giftPurchases;
    t.revenueCents += r.revenueCents;
    return t;
  }, emptyRow("All sources"));

  return { totals, bySource };
}
