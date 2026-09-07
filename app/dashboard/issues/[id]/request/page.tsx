import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RequestActions } from "./RequestActions";

export default async function RequestPage({
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
    include: {
      home: { select: { builderName: true, builderEmail: true } },
      warrantyRequests: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });

  if (!issue) notFound();

  const latestRequest = issue.warrantyRequests[0] ?? null;

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/dashboard/issues/${id}`} className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to issue
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-navy">Warranty Request</h1>
        <p className="mt-2 text-gray-600">
          Review the request before sending it to your builder. All builder-facing communication comes from you.
        </p>

        <RequestActions
          issueId={id}
          home={issue.home}
          initialRequest={latestRequest}
        />
      </div>
    </main>
  );
}
