"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function dismissReminder(
  _prevState: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!reminder) return { error: "Reminder not found" };

  await prisma.reminder.update({
    where: { id },
    data: { status: "DISMISSED" },
  });

  return { ok: true };
}
