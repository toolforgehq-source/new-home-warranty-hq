import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function IssuesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: { issues: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Issues</h1>
          <Link
            href="/dashboard/issues/new"
            className="rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
          >
            Report an Issue
          </Link>
        </div>

        {!home || home.issues.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">No issues yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Use the button above to create your first issue record.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {home.issues.map((issue) => (
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
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-navy">
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
