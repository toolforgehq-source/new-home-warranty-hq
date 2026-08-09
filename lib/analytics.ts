import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function trackEvent({
  event,
  userId,
  anonymousId,
  properties,
  sessionId,
}: {
  event: string;
  userId?: string;
  anonymousId?: string;
  properties?: Record<string, string | number | boolean | null>;
  sessionId?: string;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        userId,
        anonymousId,
        properties: (properties ?? {}) as Prisma.InputJsonValue,
        sessionId,
      },
    });
  } catch (err) {
    console.error("[analytics]", err);
  }
}
