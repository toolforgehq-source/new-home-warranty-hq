import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DismissButton } from "./DismissButton";
import { COVERAGE_KINDS, formatCoverageDate } from "@/lib/warranty-windows";

function reminderTitle(type: string, metadata: unknown): string {
  if (type === "COVERAGE_ENDING") {
    const meta = (metadata ?? {}) as { coverage?: string; endsAt?: string };
    const kind = COVERAGE_KINDS.find((k) => k.key === meta.coverage);
    if (kind && meta.endsAt) return `${kind.label} coverage ends ${formatCoverageDate(new Date(meta.endsAt))}`;
  }
  const label = type.toLowerCase().replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function RemindersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id, status: { in: ["PENDING", "SENT"] } },
    include: { issue: true, home: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-navy">Reminders</h1>
        {reminders.length === 0 ? (
          <p className="mt-4 text-gray-600">No pending reminders.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {reminders.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-navy">{reminderTitle(r.type, r.metadata)}</p>
                    {r.issue && (
                      <Link href={`/dashboard/issues/${r.issue.id}`} className="text-sm text-green hover:text-green-600">
                        {r.issue.title}
                      </Link>
                    )}
                    {r.home && <p className="text-sm text-gray-500">{r.home.address}</p>}
                    <p className="mt-1 text-sm text-gray-500">
                      {r.dueDate.toLocaleDateString()} &bull; {r.status.toLowerCase()}
                    </p>
                  </div>
                  <DismissButton reminderId={r.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
