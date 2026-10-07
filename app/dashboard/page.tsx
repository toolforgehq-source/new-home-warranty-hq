import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { daysSince } from "@/lib/date";
import { formatCoverageDate, formatTerm, getCoverageWindows } from "@/lib/warranty-windows";

const entitlementBlockedMessage = (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
    <h3 className="font-semibold">Paid access is currently paused</h3>
    <p className="mt-1 text-sm">
      This account has been refunded or the entitlement is no longer active.
      Your records are still available to view, but new warranty features are
      disabled. Contact support to reactivate.
    </p>
  </div>
);

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: { issues: true, entitlements: true },
  });

  const counts = {
    OPEN: 0,
    SUBMITTED: 0,
    SCHEDULED: 0,
    RESOLVED: 0,
  };
  for (const issue of home?.issues ?? []) {
    if (issue.status in counts) {
      counts[issue.status as keyof typeof counts]++;
    }
  }

  const daysSinceClosing = home ? daysSince(home.closingDate) : null;
  const coverageWindows = home ? getCoverageWindows(home) : [];
  const coverageConfirmed = Boolean(home?.coverageConfirmedAt);
  const hasActiveEntitlement =
    home?.entitlements.some((e) => e.status === "ACTIVE") ?? false;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-navy">
          Welcome, {session.user.name}
        </h1>

        {!home ? (
          <>
            <p className="mt-2 text-gray-600">
              Your Warranty Action Plan will appear here once your home is set up.
            </p>
            <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-navy">Warranty Action Plan</h2>
              <p className="mt-2 text-gray-600">
                Add your property address and closing date to generate a personalized
                plan with recommended review dates.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                If you purchased and haven&apos;t been redirected, check your email for the
                onboarding link.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-gray-600">{home.address}</p>
              <Link
                href="/dashboard/home"
                className="text-sm text-green hover:underline"
              >
                Manage home details
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(["OPEN", "SUBMITTED", "SCHEDULED", "RESOLVED"] as const).map(
                (status) => (
                  <Link
                    key={status}
                    href={`/dashboard/issues?status=${status.toLowerCase()}`}
                    className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <p className="text-sm text-gray-500 capitalize">{status.toLowerCase()}</p>
                    <p className="mt-2 text-3xl font-bold text-navy">
                      {counts[status]}
                    </p>
                  </Link>
                )
              )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-xl font-semibold text-navy">Warranty Action Plan</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Closing date</p>
                    <p className="mt-1 font-semibold text-navy">
                      {home.closingDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Days since closing</p>
                    <p className="mt-1 font-semibold text-navy">{daysSinceClosing}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-navy">Builder warranty coverage</h3>
                    {coverageConfirmed && (
                      <Link href="/dashboard/home" className="text-sm text-green hover:underline">
                        Edit terms
                      </Link>
                    )}
                  </div>
                  {!coverageConfirmed && coverageWindows.length > 0 && (
                    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        <span className="font-semibold">Suggested, not confirmed.</span> These are common
                        builder terms. Check them against your warranty document to turn on deadline reminders.
                      </p>
                      <Link
                        href="/dashboard/home"
                        className="shrink-0 rounded-full bg-navy px-4 py-2 text-center font-semibold text-white hover:bg-navy-700"
                      >
                        Confirm your coverage
                      </Link>
                    </div>
                  )}
                  {coverageWindows.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                      No coverage terms set. Add them from your builder&apos;s warranty document to get reminders before each one ends.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-gray-100 rounded-xl bg-gray-50">
                      {coverageWindows.map((w) => (
                        <li key={w.key} className="flex items-center justify-between gap-4 p-4">
                          <div>
                            <p className="font-medium text-navy">{w.label}</p>
                            <p className="text-sm text-gray-500">
                              {formatTerm(w.months)} &bull; {w.ended ? "ended" : "ends"} {formatCoverageDate(w.endsAt)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                              w.ended
                                ? "bg-gray-200 text-gray-600"
                                : w.daysLeft <= 60
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-50 text-green-700"
                            }`}
                          >
                            {w.ended ? "Ended" : `${w.daysLeft} days left`}
                            {!coverageConfirmed && !w.ended ? " (suggested)" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Counted from your closing date. Verify the exact terms in your builder&apos;s warranty document.
                  </p>
                </div>
                {hasActiveEntitlement ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/issues/new"
                      className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600"
                    >
                      Report an Issue
                    </Link>
                    <Link
                      href="/dashboard/documents"
                      className="rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                    >
                      Upload Documents
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6">{entitlementBlockedMessage}</div>
                )}
              </div>

              {hasActiveEntitlement && (
              <div className="rounded-2xl bg-navy p-6 text-white shadow-sm">
                <h3 className="font-semibold">First checklist</h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-200">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green text-xs font-bold text-white">
                      1
                    </span>
                    Upload builder warranty documents
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green text-xs font-bold text-white">
                      2
                    </span>
                    Walk the home and create your first issue record
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green text-xs font-bold text-white">
                      3
                    </span>
                    Generate your first warranty request when ready
                  </li>
                </ul>
              </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
