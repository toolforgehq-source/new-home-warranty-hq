import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function PartnerPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.partnerProfile.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!profile || !profile.isApproved) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-5xl px-6">
          <Link href="/" className="text-xl font-bold text-navy">
            NEW HOME WARRANTY <span className="text-green">HQ</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-navy">
          Protect your new home experience.
        </h1>

        {profile.company && (
          <p className="mt-4 text-lg text-gray-600">
            Recommended by <span className="font-semibold text-navy">{profile.company}</span>
          </p>
        )}

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-gray-600">
            New Home Warranty HQ gives new-construction buyers a simple system for documenting issues, reporting them, tracking repairs, and staying ahead of important warranty dates.
          </p>
          <div className="mt-6 text-3xl font-bold text-navy">$189 <span className="text-lg font-normal text-gray-500">one time</span></div>
          <p className="mt-2 text-sm text-gray-500">One-time payment. No subscription.</p>
          <Link
            href="/checkout?product=homeowner"
            className="mt-8 inline-block rounded-full bg-green px-8 py-4 text-lg font-semibold text-white hover:bg-green-600"
          >
            Protect My Home — $189
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Are you a partner?{" "}
          <Link href="/partner/dashboard" className="text-navy underline">
            Go to your dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
