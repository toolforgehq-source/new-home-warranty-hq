import prisma from "@/lib/prisma";

export async function hasActiveEntitlement(userId: string): Promise<boolean> {
  const now = new Date();
  const entitlement = await prisma.homeEntitlement.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return !!entitlement;
}

export async function revokeEntitlementsAndInvalidateUnredeemedTokensForPurchase(
  purchaseId: string
) {
  await prisma.homeEntitlement.updateMany({
    where: { purchaseId },
    data: { status: "REVOKED" },
  });

  await prisma.onboardingToken.updateMany({
    where: { purchaseId, usedAt: null },
    data: { expiresAt: new Date(0) },
  });
}
