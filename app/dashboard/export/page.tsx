import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ExportButton } from "./ExportButton";

export default async function ExportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!home) {
    return (
      <main className="p-6 lg:p-8">
        <p className="text-gray-600">Set up your home before exporting records.</p>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-navy">Export your records</h1>
        <p className="mt-2 text-gray-600">
          Download a ZIP with your home details, issues, documents, appointments, and repair history.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <ExportButton homeId={home.id} />
        </div>
      </div>
    </main>
  );
}
