"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

export async function createFinalReview(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const homeId = formData.get("homeId") as string;

  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      issues: { orderBy: { createdAt: "desc" } },
      documents: true,
    },
  });

  if (!home) return { error: "Home not found" };

  const openIssues = home.issues.filter((i) => i.status === "OPEN");
  const unresolvedIssues = home.issues.filter((i) => i.status === "SUBMITTED" || i.status === "SCHEDULED");
  const missingDocuments = !home.documents.some((d) => d.type === "BUILDER_WARRANTY");

  const review = await prisma.finalReview.create({
    data: {
      homeId,
      findings: {
        openIssues: openIssues.map((i) => ({ id: i.id, title: i.title, status: i.status })),
        unresolvedIssues: unresolvedIssues.map((i) => ({ id: i.id, title: i.title, status: i.status })),
        missingDocuments,
        totalIssues: home.issues.length,
      },
      completedAt: new Date(),
    },
  });

  await trackEvent({ event: "final_review_completed", userId: session.user.id, properties: { homeId: home.id, reviewId: review.id } });
  await logAudit({ actorId: session.user.id, action: "FINAL_REVIEW_COMPLETED", entityType: "FinalReview", entityId: review.id });

  redirect(`/dashboard/final-review/${review.id}`);
}
