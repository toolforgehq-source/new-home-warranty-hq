import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createSystemComment } from "@/lib/actions/comment";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Invalid confirmation link." }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { confirmationToken: token },
    include: { issue: { include: { home: true, user: true } } },
  });

  if (!appointment) {
    return NextResponse.json({ error: "This confirmation link is no longer valid." }, { status: 404 });
  }

  if (appointment.status === "CONFIRMED") {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center"><h1>Appointment already confirmed</h1><p>The appointment for ${appointment.issue.home.address} is already on the calendar.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (appointment.status !== "PROPOSED") {
    return NextResponse.json({ error: "This appointment cannot be confirmed." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "CONFIRMED" },
    });

    await tx.appointment.updateMany({
      where: { issueId: appointment.issueId, status: "PROPOSED", id: { not: appointment.id } },
      data: { status: "CANCELLED" },
    });

    if (appointment.issue.status !== "SCHEDULED" && appointment.issue.status !== "RESOLVED") {
      await tx.issue.update({
        where: { id: appointment.issueId },
        data: { status: "SCHEDULED" },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId: appointment.issueId,
          status: "SCHEDULED",
          changedBy: "BUILDER_CONFIRMATION",
          note: "Builder confirmed the appointment",
        },
      });
    }
  });

  const homeownerEmail = appointment.issue.user?.email;
  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString()
    : "To be scheduled";

  if (homeownerEmail) {
    const subject = `Appointment confirmed: ${appointment.issue.title}`;
    const text = `Good news — the builder confirmed the appointment for ${appointment.issue.title} at ${appointment.issue.home.address}.\n\nDate: ${appointmentDate}\n\nYou can view the issue in your dashboard: https://newhomewarrantyhq.com/dashboard/issues/${appointment.issueId}\n\n— New Home Warranty HQ`;
    const html = `<p>Good news — the builder confirmed the appointment for <strong>${escapeHtml(appointment.issue.title)}</strong> at ${escapeHtml(appointment.issue.home.address)}.</p><p>Date: ${appointmentDate}</p><p><a href="https://newhomewarrantyhq.com/dashboard/issues/${appointment.issueId}">View issue in dashboard</a></p><p>— New Home Warranty HQ</p>`;

    try {
      await sendEmail({ to: homeownerEmail, subject, text, html });
    } catch (err) {
      console.error("[appointment confirm] homeowner notification failed", err);
    }
  }

  await createSystemComment({
    issueId: appointment.issueId,
    content: `Builder confirmed the appointment scheduled for ${appointmentDate}.`,
  });

  return new NextResponse(
    `<html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center"><h1>Appointment confirmed</h1><p>Thank you. The appointment for ${appointment.issue.home.address} has been added to the calendar.</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
