import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { APP_URL } from "@/lib/stripe";
import { PartnerLogoutButton } from "@/components/partner/PartnerLogoutButton";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { GiftHistoryTable } from "@/components/partner/GiftHistoryTable";
import { PartnerProfileCard } from "@/components/partner/PartnerProfileCard";
import { PartnerChecklist } from "@/components/partner/PartnerChecklist";

export default async function PartnerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "PARTNER") {
    redirect("/partner/register");
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  const gifts = await prisma.giftPurchase.findMany({
    where: { partnerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { purchase: true, onboardingToken: true },
  });

  if (!profile) {
    redirect("/partner/register");
  }

  const total = gifts.length;
  const redeemed = gifts.filter((g) => g.status === "REDEEMED").length;
  const pending = gifts.filter((g) => g.status === "PAID" || g.status === "PENDING").length;
  const totalAmount = gifts.reduce((sum, g) => sum + (g.purchase?.amount ?? 0), 0);
  const publicPageUrl = `${APP_URL}/partners/${profile.slug}`;
  const profileComplete = Boolean(profile.company && profile.phone);

  const giftRows = gifts.map((g) => ({
    id: g.id,
    recipientName: g.recipientName,
    recipientEmail: g.recipientEmail,
    propertyAddress: g.propertyAddress,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    onboardingToken: g.onboardingToken ? { token: g.onboardingToken.token } : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="text-lg font-bold text-navy">
            NEW HOME WARRANTY <span className="text-green">HQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">
              {session.user.name || session.user.email}
            </span>
            <PartnerLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {profile.company ? `${profile.company} dashboard` : "Partner dashboard"}
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          <Link
            href="/checkout?product=gift"
            className="rounded-full bg-green px-6 py-3 text-center font-semibold text-white hover:bg-green-600"
          >
            Send a gift — $124
          </Link>
        </div>

        {!profile.isApproved && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Your profile is pending admin approval.</p>
            <p className="mt-1">
              Your public co-branded page and gift sharing links will be available once
              approved. You can still send gifts now.
            </p>
          </div>
        )}

        <div className="mt-8">
          <PartnerStats
            total={total}
            redeemed={redeemed}
            pending={pending}
            totalAmount={totalAmount}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GiftHistoryTable gifts={giftRows} appUrl={APP_URL} />
          </div>
          <div className="space-y-6">
            <PartnerProfileCard profile={profile} email={session.user.email} />
            <PartnerChecklist
              profileComplete={profileComplete}
              approved={profile.isApproved}
              hasGifts={total > 0}
            />
            {profile.isApproved && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-navy">Public co-branded page</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Share this link with buyers so they can purchase with your branding.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-navy">
                  <span className="truncate">{publicPageUrl}</span>
                </div>
                <Link
                  href={`/partners/${profile.slug}`}
                  className="mt-4 inline-block rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  View public page
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
