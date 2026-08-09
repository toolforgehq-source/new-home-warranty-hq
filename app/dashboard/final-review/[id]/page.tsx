import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function FinalReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const review = await prisma.finalReview.findFirst({
    where: {
      id,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: { home: { include: { issues: true } } },
  });

  if (!review) notFound();

  const findings = (review.findings as {
    openIssues?: { id: string; title: string; status: string }[];
    unresolvedIssues?: { id: string; title: string; status: string }[];
    missingDocuments?: boolean;
    totalIssues?: number;
  }) ?? {};

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/final-review" className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to final review
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-navy">Final Review Report</h1>
        <p className="mt-1 text-sm text-gray-500">Completed {review.completedAt?.toLocaleDateString()}</p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Total issues: <span className="font-semibold">{findings.totalIssues ?? 0}</span></li>
            <li>Builder warranty document: {findings.missingDocuments ? <span className="text-yellow-600">Missing</span> : <span className="text-green">On file</span>}</li>
          </ul>
        </div>

        {findings.openIssues && findings.openIssues.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Open issues</h2>
            <ul className="mt-4 space-y-2">
              {findings.openIssues.map((issue) => (
                <li key={issue.id}>
                  <Link href={`/dashboard/issues/${issue.id}`} className="text-sm text-green hover:text-green-600">
                    {issue.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {findings.unresolvedIssues && findings.unresolvedIssues.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Unresolved submitted / scheduled issues</h2>
            <ul className="mt-4 space-y-2">
              {findings.unresolvedIssues.map((issue) => (
                <li key={issue.id}>
                  <Link href={`/dashboard/issues/${issue.id}`} className="text-sm text-green hover:text-green-600">
                    {issue.title} ({issue.status.toLowerCase()})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
