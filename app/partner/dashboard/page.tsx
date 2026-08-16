import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PartnerLogoutButton } from "@/components/partner/PartnerLogoutButton";

export default async function PartnerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    redirect("/partner/register");
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const gifts = await prisma.giftPurchase.findMany({
    where: { partnerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!profile) {
    redirect("/partner/register");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-navy">
            NEW HOME WARRANTY <span className="text-green">HQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name || session.user.email}</span>
            <PartnerLogoutButton />
          </div>
        </header>
        <h1 className="text-2xl font-bold text-navy">Partner Dashboard</h1>

        {!profile.isApproved && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            Your profile is pending admin approval. Your public co-branded page will be available once approved.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-navy">Gift status</h2>
            {gifts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No gifts sent yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {gifts.map((gift) => (
                  <li key={gift.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-navy">{gift.recipientName}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-navy">
                        {gift.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-500">{gift.recipientEmail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-navy">Send a gift</h2>
            <p className="mt-2 text-sm text-gray-600">$124 one-time payment. No subscription.</p>
            <Link
              href="/checkout?product=gift"
              className="mt-4 inline-block w-full rounded-full bg-green py-3 text-center font-semibold text-white hover:bg-green-600"
            >
              Gift It to a Buyer
            </Link>
            {profile.isApproved && (
              <Link
                href={`/partners/${profile.slug}`}
                className="mt-3 inline-block w-full rounded-full bg-white py-3 text-center font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
              >
                View public page
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
