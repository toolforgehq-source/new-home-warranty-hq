import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import OnboardingForm from "./OnboardingForm";

function OnboardingError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy">Set up your home</h1>
        <p className="mt-4 text-red-700">{message}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-navy hover:underline">
          Return home
        </Link>
      </div>
    </div>
  );
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const tokenParam = params.token;
  const sessionId = params.session_id;

  // Helper: validate an onboarding token before rendering the form.
  const validateToken = async (token: string) => {
    const record = await prisma.onboardingToken.findUnique({
      where: { token },
      include: { purchase: true, giftPurchase: { include: { purchase: true } } },
    });
    if (!record) return "Invalid onboarding link." as const;
    if (record.usedAt) return "This onboarding link has already been used." as const;
    if (record.expiresAt < new Date()) return "This onboarding link has expired." as const;
    const purchase = record.purchase || record.giftPurchase?.purchase;
    if (!purchase || purchase.status !== "SUCCEEDED") {
      return "This purchase is not active. Please complete payment first." as const;
    }
    return null;
  };

  if (tokenParam) {
    const error = await validateToken(tokenParam);
    if (error) return <OnboardingError message={error} />;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-navy">Set up your home</h1>
          <p className="mt-2 text-gray-600">
            Welcome to New Home Warranty HQ. Let&apos;s get your property information.
          </p>
          <OnboardingForm token={tokenParam} />
        </div>
      </div>
    );
  }

  if (sessionId) {
    const purchase = await prisma.purchase.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { onboardingToken: true },
    });

    if (!purchase) {
      return <OnboardingError message="We could not find your purchase. Please check your link." />;
    }

    if (purchase.status !== "SUCCEEDED") {
      return <OnboardingError message="Your payment has not been completed. Please finish checkout first." />;
    }

    const token = purchase.onboardingToken?.token;
    if (!token) {
      return (
        <OnboardingError message="Your purchase is being finalized. Please wait a moment and refresh." />
      );
    }

    const error = await validateToken(token);
    if (error) return <OnboardingError message={error} />;

    redirect(`/onboarding?token=${encodeURIComponent(token)}`);
  }

  return <OnboardingError message="Missing onboarding link. Please use the link from your email or receipt." />;
}
