"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PartnerType } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { sendPartnerApprovedEmail, sendPartnerGiftReceipt } from "@/lib/emails/partner";
import { sendGiftInvitation } from "@/lib/emails/gift";
import { APP_URL } from "@/lib/stripe";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .substring(0, 60);
}

export async function registerPartner(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const company = (formData.get("company") as string)?.trim();
  const partnerType = (formData.get("partnerType") as string) || "OTHER";

  if (!name || !email || !password || password.length < 8) {
    return { error: "Please provide a name, email, and password of at least 8 characters." };
  }

  const baseSlug = slugify(company || name);
  let slug = baseSlug || slugify(email.split("@")[0]);

  const existing = await prisma.partnerProfile.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    const user = result.user as { id: string };

    const profile = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "PARTNER" },
      });

      return tx.partnerProfile.create({
        data: {
          userId: user.id,
          partnerType: partnerType as PartnerType,
          company,
          slug,
          isApproved: false,
        },
      });
    });

    await trackEvent({ event: "partner_registered", userId: user.id, properties: { partnerType, slug } });
    await logAudit({ actorId: user.id, action: "PARTNER_REGISTERED", entityType: "PartnerProfile", entityId: profile.id });
  } catch (err) {
    console.error("[partner register]", err);
    return { error: "Could not create partner account. The email may already be in use." };
  }

  redirect("/partner/dashboard");
}

export async function approvePartner(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const id = formData.get("partnerProfileId") as string;
  if (!id) return { error: "Missing partner profile" };

  const profile = await prisma.partnerProfile.update({
    where: { id },
    data: { isApproved: true },
    include: { user: true },
  });

  const publicPageUrl = `${APP_URL}/partners/${profile.slug}`;

  await sendPartnerApprovedEmail({
    to: profile.user.email,
    name: profile.user.name || profile.user.email,
    publicPageUrl,
  });

  await trackEvent({ event: "partner_approved", userId: session.user.id, properties: { partnerId: profile.id } });
  await logAudit({ actorId: session.user.id, action: "PARTNER_APPROVED", entityType: "PartnerProfile", entityId: profile.id });

  return { ok: true };
}

export async function updatePartnerProfile(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    return { error: "Unauthorized" };
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return { error: "Partner profile not found" };

  const company = (formData.get("company") as string)?.trim() || profile.company;
  const phone = (formData.get("phone") as string)?.trim() || profile.phone;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || profile.photoUrl;
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || profile.logoUrl;

  if (photoUrl && !isValidUrl(photoUrl)) return { error: "Photo URL is not valid" };
  if (logoUrl && !isValidUrl(logoUrl)) return { error: "Logo URL is not valid" };

  const updated = await prisma.partnerProfile.update({
    where: { userId: session.user.id },
    data: { company, phone, photoUrl, logoUrl },
  });

  await logAudit({ actorId: session.user.id, action: "PARTNER_PROFILE_UPDATED", entityType: "PartnerProfile", entityId: updated.id });

  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/dashboard/edit");
  return { ok: true };
}

function isValidUrl(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export async function resendGiftInvitation(
  _prevState: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    return { error: "Unauthorized" };
  }

  const giftId = formData.get("giftId") as string;
  if (!giftId) return { error: "Missing gift" };

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const gift = await prisma.giftPurchase.findFirst({
    where: { id: giftId, partnerId: session.user.id },
    include: { onboardingToken: true, purchase: true },
  });

  if (!gift) return { error: "Gift not found" };
  if (gift.status === "REDEEMED") return { error: "This gift has already been redeemed" };
  if (gift.purchase?.status !== "SUCCEEDED") return { error: "This gift payment is not complete" };
  if (!gift.onboardingToken) return { error: "No invitation link found" };

  const redemptionUrl = `${APP_URL}/onboarding?token=${gift.onboardingToken.token}`;

  await sendGiftInvitation({
    to: gift.recipientEmail,
    buyerName: session.user.name || session.user.email,
    buyerCompany: profile?.company,
    redemptionUrl,
  });

  await logAudit({ actorId: session.user.id, action: "GIFT_INVITATION_RESENT", entityType: "GiftPurchase", entityId: gift.id });

  return { ok: true };
}

export async function sendGiftReceipt(
  _prevState: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    return { error: "Unauthorized" };
  }

  const giftId = formData.get("giftId") as string;
  if (!giftId) return { error: "Missing gift" };

  const gift = await prisma.giftPurchase.findFirst({
    where: { id: giftId, partnerId: session.user.id },
    include: { purchase: true },
  });

  if (!gift || !gift.purchase) return { error: "Gift not found" };
  if (gift.purchase.status !== "SUCCEEDED") return { error: "Receipt not available until payment is complete" };

  await sendPartnerGiftReceipt({
    to: session.user.email,
    partnerName: session.user.name || session.user.email,
    recipientName: gift.recipientName,
    recipientEmail: gift.recipientEmail,
    amount: gift.purchase.amount,
    purchasedAt: gift.purchase.createdAt,
  });

  await logAudit({ actorId: session.user.id, action: "GIFT_RECEIPT_SENT", entityType: "GiftPurchase", entityId: gift.id });

  return { ok: true };
}
