import prisma from "@/lib/prisma";

export async function hasActiveEntitlement(userId: string): Promise<boolean> {
  const entitlement = await prisma.homeEntitlement.findFirst({
    where: { userId, status: "ACTIVE" },
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
