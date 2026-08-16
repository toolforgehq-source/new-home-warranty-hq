import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const tokenParam = params.token;
  const sessionId = params.session_id;

  if (!tokenParam && sessionId) {
    const purchase = await prisma.purchase.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { onboardingToken: true },
    });
    const token = purchase?.onboardingToken?.token;
    if (token) {
      redirect(`/onboarding?token=${encodeURIComponent(token)}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy">Set up your home</h1>
        <p className="mt-2 text-gray-600">
          Welcome to New Home Warranty HQ. Let&apos;s get your property information.
        </p>
        <OnboardingForm token={tokenParam ?? ""} />
      </div>
    </div>
  );
}
