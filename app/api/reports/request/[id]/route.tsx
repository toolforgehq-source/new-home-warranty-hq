import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WarrantyRequestPDF } from "@/lib/pdf/warranty-request";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const warrantyRequest = await prisma.warrantyRequest.findFirst({
    where: {
      id,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
    include: {
      home: true,
      issue: true,
    },
  });

  if (!warrantyRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderToBuffer(
    <WarrantyRequestPDF
      request={{
        generatedContent: warrantyRequest.generatedContent,
        requestedNextStep: warrantyRequest.requestedNextStep,
        home: { address: warrantyRequest.home.address, builderName: warrantyRequest.home.builderName },
        issue: warrantyRequest.issue
          ? {
              title: warrantyRequest.issue.title,
              location: warrantyRequest.issue.location,
              dateNoticed: warrantyRequest.issue.dateNoticed,
              description: warrantyRequest.issue.description,
            }
          : null,
      }}
    />
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="warranty-request-${id}.pdf"`,
    },
  });
}
