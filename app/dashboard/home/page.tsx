import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { HomeForm } from "./HomeForm";

export default async function HomeSettingsPage() {
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

  if (!home) notFound();

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-navy">Home details</h1>
        <p className="mt-2 text-gray-600">Keep builder contact info up to date so warranty requests go to the right place.</p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <HomeForm home={home} />
        </div>
      </div>
    </main>
  );
}
