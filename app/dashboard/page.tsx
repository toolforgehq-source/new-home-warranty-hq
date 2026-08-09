import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { daysSince, addMonths } from "@/lib/date";

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
  const recommended11Month = home ? addMonths(home.closingDate, 11) : null;

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
            <p className="mt-2 text-gray-600">{home.address}</p>
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
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Recommended 11-month review</p>
                    <p className="mt-1 font-semibold text-navy">
                      {recommended11Month?.toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Recommended — verify with your builder documents</p>
                  </div>
                </div>
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
              </div>

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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
