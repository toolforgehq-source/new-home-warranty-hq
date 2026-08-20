"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

export async function updateHome(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const homeId = formData.get("homeId") as string;
  const builderName = (formData.get("builderName") as string)?.trim();
  const builderEmail = (formData.get("builderEmail") as string)?.trim() || null;
  const builderPhone = (formData.get("builderPhone") as string)?.trim() || null;
  const builderContactName = (formData.get("builderContactName") as string)?.trim() || null;
  const builderWarrantyPortalUrl = (formData.get("builderWarrantyPortalUrl") as string)?.trim() || null;

  if (!builderName) return { error: "Builder name is required." };

  const home = await prisma.home.findFirst({
    where: {
      id: homeId,
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!home) return { error: "Home not found." };

  await prisma.home.update({
    where: { id: homeId },
    data: {
      builderName,
      builderEmail,
      builderPhone,
      builderContactName,
      builderWarrantyPortalUrl,
    },
  });

  await trackEvent({ event: "home_updated", userId: session.user.id, properties: { homeId } });
  await logAudit({ actorId: session.user.id, action: "HOME_UPDATED", entityType: "Home", entityId: homeId });

  redirect("/dashboard");
}
