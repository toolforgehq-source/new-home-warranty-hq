"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

export async function uploadDocument(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!home) return { error: "No home found" };

  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string)?.trim();
  const type = (formData.get("type") as string) || "OTHER";

  if (!file || !label) {
    return { error: "File and label are required" };
  }

  const ext = file.name.split(".").pop() || "";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `documents/${home.id}/${Date.now()}-${safeName}`;

  try {
    await uploadFile(file, key);
  } catch (err) {
    console.error("[uploadDocument]", err);
    return { error: "Could not upload file. Storage may not be configured." };
  }

  await prisma.document.create({
    data: {
      homeId: home.id,
      userId: session.user.id,
      type: type as any,
      label,
      fileKey: key,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  redirect("/dashboard/documents");
}
