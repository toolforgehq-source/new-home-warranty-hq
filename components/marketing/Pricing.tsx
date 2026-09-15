import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-navy">One price. Whole warranty period.</h2>
          <p className="mt-4 text-lg text-gray-600">
            No subscriptions, no recurring charges. Pay once and keep your records
            for good.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-xl rounded-2xl border-2 border-navy bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            For Homeowners
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-navy">$189</span>
            <span className="text-gray-500">one-time payment</span>
          </div>
          <p className="mt-4 text-gray-600">
            Everything you need to document, report, track, and prove every
            warranty item in your new home.
          </p>
          <ul className="mt-6 space-y-3 text-gray-600">
            {[
              "Warranty deadline reminders",
              "Unlimited issues & photos",
              "One-click builder requests with PDF",
              "Builder replies logged automatically",
              "Appointment & repair tracking",
              "Warranty document storage",
              "Full record export (PDF & ZIP)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/checkout?product=homeowner"
            className="mt-8 block w-full rounded-full bg-green py-4 text-center text-lg font-semibold text-white hover:bg-green-600"
          >
            Start My Warranty HQ — $189
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="h-4 w-4 text-green" />
            30-day money-back guarantee.{" "}
            <Link href="/refund" className="text-green hover:underline">
              See refund policy
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Buying for a client?{" "}
          <Link href="/partners" className="font-medium text-navy hover:underline">
            Gift New Home Warranty HQ for $124 &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}
