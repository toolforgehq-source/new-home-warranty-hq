import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PartnerProfileEditForm } from "@/components/partner/PartnerProfileEditForm";

export const metadata = {
  title: "Edit Partner Profile — New Home Warranty HQ",
};

export default async function PartnerDashboardEditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    redirect("/partner/register");
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) redirect("/partner/register");

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/partner/dashboard" className="text-sm text-navy hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-navy">Edit partner profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          This information appears on your co-branded public page.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <PartnerProfileEditForm profile={profile} email={session.user.email} />
        </div>
      </div>
    </div>
  );
}
