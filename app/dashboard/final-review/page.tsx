import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateFinalReviewButton } from "./CreateFinalReviewButton";

export default async function FinalReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: { issues: true, documents: true },
  });

  if (!home) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-gray-600">Set up your home to run a final review.</p>
      </main>
    );
  }

  const openIssues = home.issues.filter((i) => i.status === "OPEN");
  const unresolvedIssues = home.issues.filter((i) => i.status === "SUBMITTED" || i.status === "SCHEDULED");
  const hasBuilderWarranty = home.documents.some((d) => d.type === "BUILDER_WARRANTY");

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-navy">Final Warranty Review</h1>
        <p className="mt-2 text-gray-600">Walk through your home and confirm your records before warranty periods end.</p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">What to review</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li>Open issues: <span className="font-semibold text-navy">{openIssues.length}</span></li>
            <li>Unresolved submitted / scheduled issues: <span className="font-semibold text-navy">{unresolvedIssues.length}</span></li>
            <li>Builder warranty document: {hasBuilderWarranty ? <span className="text-green">On file</span> : <span className="text-yellow-600">Missing</span>}</li>
            <li>Recommended 11-month review: {new Date(home.closingDate.getFullYear(), home.closingDate.getMonth() + 11, home.closingDate.getDate()).toLocaleDateString()}</li>
          </ul>

          <div className="mt-6">
            <CreateFinalReviewButton homeId={home.id} />
          </div>
        </div>

        {home.issues.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">All issues</h2>
            <ul className="mt-4 space-y-2">
              {home.issues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between text-sm">
                  <Link href={`/dashboard/issues/${issue.id}`} className="text-green hover:text-green-600">
                    {issue.title}
                  </Link>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-navy">{issue.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
