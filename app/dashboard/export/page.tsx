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

  const folder = home.address.replace(/\W+/g, "_");
  const contents = [
    ["home.json", "Home details and every issue record"],
    ["warranty-documents/", "Your builder warranty files"],
    ["issues/<issue>/photos/", "Every photo, per issue"],
    ["communications/<issue>.txt", "Full builder conversation"],
    ["requests/<issue>.pdf", "Each warranty request you generated"],
  ];

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-navy">Export your records</h1>
        <p className="mt-2 text-gray-600">
          Download a ZIP with your home details, issues, documents, appointments, and repair history.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">{folder}.zip</p>
          <ul className="mt-2 space-y-1 font-mono text-sm text-gray-700">
            {contents.map(([path, note]) => (
              <li key={path} className="flex flex-wrap justify-between gap-x-4">
                <span>{path}</span>
                <span className="font-sans text-xs text-gray-500">{note}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <ExportButton homeId={home.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
