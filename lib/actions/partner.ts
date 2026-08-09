"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  // ensure unique slug
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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "PARTNER" },
      });

      await tx.partnerProfile.create({
        data: {
          userId: user.id,
          partnerType: partnerType as any,
          company,
          slug,
          isApproved: false,
        },
      });
    });
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

  await prisma.partnerProfile.update({
    where: { id },
    data: { isApproved: true },
  });

  return { ok: true };
}
