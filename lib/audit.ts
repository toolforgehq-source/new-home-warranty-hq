"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function logAudit({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const heads = await headers();
  const ipAddress = heads.get("x-forwarded-for") ?? undefined;
  const userAgent = heads.get("user-agent") ?? undefined;

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
