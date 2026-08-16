"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

export async function completeOnboarding(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const tokenValue = formData.get("token") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const address = formData.get("address") as string;
  const closingDate = formData.get("closingDate") as string;
  const builderName = formData.get("builderName") as string;
  const occupancyDate = formData.get("occupancyDate") as string | undefined;

  if (!tokenValue || !name || !password || !address || !closingDate || !builderName) {
    return { error: "Please fill out all required fields." };
  }

  const token = await prisma.onboardingToken.findUnique({
    where: { token: tokenValue },
    include: {
      purchase: true,
      giftPurchase: { include: { purchase: true } },
    },
  });

  if (!token) {
    return { error: "Invalid onboarding link." };
  }
  if (token.usedAt) {
    return { error: "This onboarding link has already been used." };
  }
  if (token.expiresAt < new Date()) {
    return { error: "This onboarding link has expired." };
  }

  const purchase = token.purchase || token.giftPurchase?.purchase;
  if (!purchase) {
    return { error: "Purchase record not found." };
  }
  if (purchase.status !== "SUCCEEDED") {
    return { error: "This purchase is not active. Please complete payment first." };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email: token.email,
        password,
      },
      headers: await headers(),
    });

    const user = result.user as { id: string; email: string };

    await prisma.$transaction(async (tx) => {
      const home = await tx.home.create({
        data: {
          primaryOwnerId: user.id,
          address,
          closingDate: new Date(closingDate),
          occupancyDate: occupancyDate ? new Date(occupancyDate) : null,
          builderName,
          giftPurchaseId: token.giftPurchaseId,
        },
      });

      await tx.homeEntitlement.create({
        data: {
          userId: user.id,
          homeId: home.id,
          purchaseId: purchase.id,
          status: "ACTIVE",
        },
      });

      await tx.onboardingToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { userId: user.id },
      });

      if (token.giftPurchaseId) {
        await tx.giftPurchase.update({
          where: { id: token.giftPurchaseId },
          data: {
            redeemedAt: new Date(),
            redeemedByUserId: user.id,
            status: "REDEEMED",
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { onboardingCompletedAt: new Date() },
      });

      await tx.reminderSetting.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          emailEnabled: true,
          smsEnabled: false,
          digestEnabled: true,
        },
        update: {},
      });
    });

    const home = await prisma.home.findFirst({ where: { primaryOwnerId: user.id }, orderBy: { createdAt: "desc" } });
    if (home) {
      await sendWelcomeEmail({ to: token.email, name, address: home.address });
      await trackEvent({ event: "account_activated", userId: user.id, properties: { homeId: home.id } });
      await logAudit({ actorId: user.id, action: "ONBOARDING_COMPLETED", entityType: "Home", entityId: home.id });
    }
  } catch (err) {
    console.error("[onboarding error]", err);
    return { error: "Could not create your account. The email may already be in use." };
  }

  redirect("/dashboard");
}
