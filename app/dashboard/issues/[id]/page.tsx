import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";
import { SubmissionForm } from "./SubmissionForm";
import { AppointmentForm } from "./AppointmentForm";
import { RepairVerificationForm } from "./RepairVerificationForm";
import { IssueCommentThread } from "./IssueCommentThread";
import { formatAppointmentWhen } from "@/lib/date";
import { formatShortDate, getIssueProgress } from "@/lib/issue-progress";
import { CheckCircle2 } from "lucide-react";

const statusBadgeStyles: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
};

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const issue = await prisma.issue.findFirst({
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
      documents: { orderBy: { uploadedAt: "asc" } },
      warrantyRequests: { orderBy: { generatedAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      submissionRecords: true,
      appointments: { orderBy: { createdAt: "desc" } },
      repairVerifications: true,
      comments: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (!issue) notFound();

  const progress = getIssueProgress(issue);
  const categoryLabel = issue.category
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" / ");
  const chips = [
    categoryLabel,
    issue.location,
    issue.dateNoticed ? `Noticed ${formatShortDate(issue.dateNoticed, "UTC")}` : `Reported ${formatShortDate(issue.createdAt)}`,
  ].filter(Boolean) as string[];

  const approvedRequest = issue.warrantyRequests.find((r) => r.status === "APPROVED" || r.status === "SENT");

  const photos = issue.documents.filter((d) => d.type === "ISSUE_PHOTO" && d.status === "ACTIVE");
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      try {
        const url = await getSignedDownloadUrl(photo.fileKey);
        return { ...photo, url };
      } catch {
        return { ...photo, url: null };
      }
    })
  );

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/issues" className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to issues
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">{issue.title}</h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium capitalize ${
                statusBadgeStyles[issue.status] ?? "bg-gray-100 text-navy"
              }`}
            >
              {issue.status.toLowerCase()}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-navy">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-gray-100 px-3 py-1">
                {chip}
              </span>
            ))}
          </div>

          {issue.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-500">Description</h2>
              <p className="mt-1 whitespace-pre-line text-navy">{issue.description}</p>
            </div>
          )}

          {photosWithUrls.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-500">Photos</h2>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photosWithUrls.map((photo) =>
                  photo.url ? (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded-lg bg-gray-100"
                    >
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ) : (
                    <div
                      key={photo.id}
                      className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500"
                    >
                      Photo unavailable
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Recurring</p>
              <p className="font-medium text-navy">{issue.isRecurring ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Getting worse</p>
              <p className="font-medium text-navy">{issue.isWorsening ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/issues/${issue.id}/request`}
              className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600"
            >
              {approvedRequest?.status === "SENT" ? "View sent request" : "Generate Request"}
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Progress</h2>
          <ol className="mt-4 space-y-2 text-sm">
            {progress.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"
              >
                <span className="flex items-center gap-2 font-medium text-navy">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${step.done ? "text-green" : "text-gray-300"}`} />
                  {step.label}
                </span>
                <span className={`text-right text-xs ${step.done ? "text-green-600" : "text-gray-400"}`}>{step.when}</span>
              </li>
            ))}
          </ol>
          {issue.statusHistory.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600">Full status history</summary>
              <ul className="mt-3 space-y-2">
                {issue.statusHistory.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize text-navy">
                      {record.status.toLowerCase()}
                      {record.note && <span className="normal-case text-gray-500"> &middot; {record.note}</span>}
                    </span>
                    <span className="shrink-0 text-gray-500">{record.createdAt.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {issue.submissionRecords.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Submission Records</h2>
            <ul className="mt-4 space-y-4">
              {issue.submissionRecords.map((record) => (
                <li key={record.id} className="rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-navy">{record.method.toLowerCase()}</span>
                    <span className="text-gray-500">{record.createdAt.toLocaleString()}</span>
                  </div>
                  {record.destination && <p className="mt-1 text-gray-600">To: {record.destination}</p>}
                  {record.confirmationNumber && (
                    <p className="mt-1 text-gray-600">Confirmation: {record.confirmationNumber}</p>
                  )}
                  {record.message && <p className="mt-2 whitespace-pre-line text-navy">{record.message}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <IssueCommentThread
          issueId={issue.id}
          comments={issue.comments}
          builderName={issue.home.builderName}
          currentUserId={session.user.id}
        />

        <SubmissionForm issueId={issue.id} warrantyRequestId={approvedRequest?.id ?? null} />

        {issue.appointments.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Appointments</h2>
            <ul className="mt-4 space-y-4">
              {issue.appointments.map((appt) => (
                <li key={appt.id} className="rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy">
                      {formatAppointmentWhen(appt.appointmentDate, appt.appointmentStartTime, appt.appointmentEndTime, "No date")}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-navy">
                      {appt.status.toLowerCase()}
                    </span>
                    {appt.missed && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Missed</span>}
                    {appt.completionDate && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Completed {new Date(appt.completionDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {appt.builderRepresentative && <p className="mt-1 text-gray-600">Rep: {appt.builderRepresentative}</p>}
                  {appt.trade && <p className="mt-1 text-gray-600">Trade: {appt.trade}</p>}
                  {appt.promisedActions && <p className="mt-2 whitespace-pre-line text-navy">{appt.promisedActions}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <AppointmentForm issueId={issue.id} home={issue.home} />

        {issue.repairVerifications.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Repair verifications</h2>
            <ul className="mt-4 space-y-4">
              {issue.repairVerifications.map((v) => (
                <li key={v.id} className="rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-navy">
                      {v.status.toLowerCase().replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
                  </div>
                  {v.notes && <p className="mt-2 whitespace-pre-line text-navy">{v.notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {issue.status !== "RESOLVED" && <RepairVerificationForm issueId={issue.id} />}
      </div>
    </main>
  );
}
