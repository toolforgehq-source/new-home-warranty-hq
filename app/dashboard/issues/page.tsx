import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const statusLabels = ["OPEN", "SUBMITTED", "SCHEDULED", "RESOLVED"] as const;

const statusBadgeStyles: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
};

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { status } = await searchParams;
  const activeStatus = status?.toUpperCase();

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: { issues: { orderBy: { createdAt: "desc" } } },
  });

  const issues =
    home?.issues.filter((i) => (!activeStatus ? true : i.status === activeStatus)) ?? [];

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-navy">Issues</h1>
          <Link
            href="/dashboard/issues/new"
            className="rounded-full bg-green px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-600"
          >
            Report an Issue
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/dashboard/issues"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !activeStatus ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-gray-200"
            }`}
          >
            All
          </Link>
          {statusLabels.map((s) => (
            <Link
              key={s}
              href={`/dashboard/issues?status=${s.toLowerCase()}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                activeStatus === s ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-gray-200"
              }`}
            >
              {s.toLowerCase()}
            </Link>
          ))}
        </div>

        {!home || issues.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              {activeStatus
                ? `No ${activeStatus.toLowerCase()} issues.`
                : "No issues yet."}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Use the button above to create your first issue record.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/dashboard/issues/${issue.id}`}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-navy">{issue.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {issue.location} &bull; {issue.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                      statusBadgeStyles[issue.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {issue.status.toLowerCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
