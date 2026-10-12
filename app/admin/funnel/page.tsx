import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { daysAgo, summarizeFunnel, type FunnelRow } from "@/lib/funnel";

const RANGES = [7, 30, 90] as const;

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—");

export default async function AdminFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const requested = Number((await searchParams).days);
  const days = RANGES.find((r) => r === requested) ?? 30;
  const since = daysAgo(days);
  const select = { anonymousId: true, properties: true } as const;

  const [views, checkouts, purchases, refunds] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { event: "page_view", createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select,
    }),
    prisma.analyticsEvent.findMany({ where: { event: "checkout_started", createdAt: { gte: since } }, select }),
    prisma.analyticsEvent.findMany({ where: { event: "purchase_completed", createdAt: { gte: since } }, select }),
    prisma.purchase.findMany({
      where: { refundedAt: { gte: since } },
      select: { amount: true, refundAmount: true },
    }),
  ]);

  const { totals, bySource } = summarizeFunnel({ views, checkouts, purchases });
  const refundedCents = refunds.reduce((sum, r) => sum + (r.refundAmount ?? r.amount), 0);

  const cards = [
    { label: "Visitors", value: totals.visitors.toLocaleString() },
    { label: "Started checkout", value: totals.checkouts.toLocaleString(), sub: `${pct(totals.checkouts, totals.visitors)} of visitors` },
    { label: "Homeowner purchases", value: totals.homeownerPurchases.toLocaleString(), sub: `${pct(totals.homeownerPurchases, totals.checkouts)} of checkouts` },
    { label: "Partner gifts", value: totals.giftPurchases.toLocaleString() },
    { label: "Revenue", value: dollars(totals.revenueCents) },
    { label: "Refunds", value: refunds.length.toLocaleString(), sub: dollars(refundedCents) },
  ];

  const cell = "px-4 py-3 text-right tabular-nums";
  const renderRow = (r: FunnelRow, bold = false) => (
    <tr key={r.source} className={bold ? "bg-gray-50 font-semibold" : "border-t border-gray-100"}>
      <td className="px-4 py-3 text-left">{r.source}</td>
      <td className={cell}>{r.visitors}</td>
      <td className={cell}>{r.checkouts}</td>
      <td className={cell}>{r.homeownerPurchases}</td>
      <td className={cell}>{pct(r.homeownerPurchases, r.visitors)}</td>
      <td className={cell}>{r.giftPurchases}</td>
      <td className={cell}>{dollars(r.revenueCents)}</td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-green hover:underline">
              &larr; Admin
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-navy">Marketing funnel</h1>
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/funnel?days=${r}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                  r === days ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-gray-200 hover:bg-gray-50"
                }`}
              >
                Last {r} days
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-2 text-2xl font-bold text-navy">{c.value}</p>
              {c.sub && <p className="mt-1 text-xs text-gray-500">{c.sub}</p>}
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm text-gray-700">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-right">Visitors</th>
                <th className="px-4 py-3 text-right">Started checkout</th>
                <th className="px-4 py-3 text-right">Purchases</th>
                <th className="px-4 py-3 text-right">Visitor → purchase</th>
                <th className="px-4 py-3 text-right">Gifts</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {bySource.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No visits recorded in this range yet.
                  </td>
                </tr>
              ) : (
                bySource.map((r) => renderRow(r))
              )}
              {bySource.length > 0 && renderRow(totals, true)}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Visitors are unique browsers (bots excluded), counted under the source of their first visit in
          this range. Purchases and checkouts are credited to the source the buyer first arrived from
          (kept for 90 days). Revenue is before Stripe fees and refunds. Partner gifts are bought from the
          partner dashboard, so they usually show as &ldquo;direct&rdquo; or a partner source.
        </p>
      </div>
    </div>
  );
}
