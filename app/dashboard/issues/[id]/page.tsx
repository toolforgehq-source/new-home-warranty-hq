import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const issue = await prisma.issue.findFirst({
    where: {
      id,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: { documents: true, warrantyRequests: true, statusHistory: true },
  });

  if (!issue) notFound();

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/issues" className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to issues
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">{issue.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {issue.location} &bull; {issue.category.replace("_", " / ")} &bull;{" "}
                {issue.createdAt.toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-navy">
              {issue.status.toLowerCase()}
            </span>
          </div>

          {issue.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-500">Description</h2>
              <p className="mt-1 whitespace-pre-line text-navy">{issue.description}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Recurring</p>
              <p className="font-medium text-navy">{issue.isRecurring ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Getting worse</p>
              <p className="font-medium text-navy">{issue.isWorsening ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/issues/${issue.id}/request`}
              className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600"
            >
              Generate Request
            </Link>
            <Link
              href={`/dashboard/issues/${issue.id}/edit`}
              className="rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Status History</h2>
          <ul className="mt-4 space-y-3">
            {issue.statusHistory.map((record) => (
              <li key={record.id} className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-navy">{record.status.toLowerCase()}</span>
                <span className="text-gray-500">{record.createdAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
