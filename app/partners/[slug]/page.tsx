import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Lock, Gift } from "lucide-react";
import prisma from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.partnerProfile.findUnique({ where: { slug }, include: { user: true } });
  const company = profile?.company || "Your partner";
  return {
    title: `${company} recommends New Home Warranty HQ`,
  };
}

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

  const company = profile.company || profile.user.name || "Your partner";
  const initials = company.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-navy">
            NEW HOME WARRANTY <span className="text-green">HQ</span>
          </Link>
          <Link href="/partner/dashboard" className="text-sm font-medium text-navy hover:text-green">
            Partner login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white shadow-sm">
          {profile.logoUrl ? (
            <Image src={profile.logoUrl} alt={company} width={80} height={80} unoptimized className="h-20 w-20 rounded-full object-contain" />
          ) : (
            initials
          )}
        </div>

        <h1 className="mt-6 text-4xl font-bold text-navy">
          Protect your new home experience
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Recommended by{" "}
          <span className="font-semibold text-navy">{company}</span>
        </p>

        {profile.photoUrl && (
          <div className="mt-6 flex justify-center">
            <Image
              src={profile.photoUrl}
              alt={company}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-sm"
            />
          </div>
        )}

        {profile.phone && (
          <p className="mt-4 text-sm text-gray-500">
            Questions? Call{" "}
            <a href={`tel:${profile.phone}`} className="text-green hover:underline">
              {profile.phone}
            </a>
          </p>
        )}

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm text-left">
          <p className="text-gray-600">
            New Home Warranty HQ gives new-construction buyers a simple system
            for documenting issues, reporting them, tracking repairs, and staying
            ahead of important warranty dates.
          </p>
          <ul className="mt-6 space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
              Document issues with photos and dates
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
              Generate professional warranty requests
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
              Track builder responses and repairs
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green" />
              Export your complete home record
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-green" />
              {company} cannot see your private issues
            </li>
          </ul>

          <div className="mt-8 text-center">
            <div className="text-3xl font-bold text-navy">
              $189 <span className="text-lg font-normal text-gray-500">one time</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">One-time payment. No subscription.</p>
            <Link
              href="/checkout?product=homeowner"
              className="mt-6 inline-block rounded-full bg-green px-8 py-4 text-lg font-semibold text-white hover:bg-green-600"
            >
              Protect My Home — $189
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border-2 border-navy bg-white p-8 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green text-white">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-navy">Give this as a gift</p>
              <p className="text-sm text-gray-600">
                Know another new-construction buyer? Gift the same system for
                $124.
              </p>
            </div>
          </div>
          <Link
            href="/checkout?product=gift"
            className="mt-6 inline-block rounded-full border-2 border-navy px-6 py-3 font-semibold text-navy hover:bg-navy hover:text-white"
          >
            Gift It to a Buyer — $124
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          New Home Warranty HQ is a software tool, not a warranty provider,
          insurer, or law firm.
        </p>
      </main>
    </div>
  );
}
