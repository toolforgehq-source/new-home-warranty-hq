import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AdminAuditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-600">No audit entries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {logs.map((log) => (
                <li key={log.id} className="py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy">{log.action}</span>
                    <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-gray-600">
                    {log.actor ? `${log.actor.name || log.actor.email}` : "System"} &bull; {log.entityType}{" "}
                    {log.entityId ? `(${log.entityId})` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
