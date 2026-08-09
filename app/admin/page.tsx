import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApproveButton } from "./_components/ApproveButton";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const pendingPartners = await prisma.partnerProfile.findMany({
    where: { isApproved: false },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    users: await prisma.user.count(),
    homes: await prisma.home.count(),
    purchases: await prisma.purchase.count(),
    issues: await prisma.issue.count(),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500 capitalize">{key}</p>
              <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/admin/refunds" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50">
            Refunds
          </Link>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy">Pending partner approvals</h2>
          {pendingPartners.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No pending partners.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {pendingPartners.map((partner) => (
                <li key={partner.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-navy">{partner.user.name || partner.user.email}</p>
                    <p className="text-sm text-gray-500">{partner.company}</p>
                    <Link href={`/partners/${partner.slug}`} className="text-sm text-green hover:text-green-600">
                      /partners/{partner.slug}
                    </Link>
                  </div>
                  <ApproveButton partnerProfileId={partner.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
