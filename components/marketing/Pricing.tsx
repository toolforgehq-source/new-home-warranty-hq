import Link from "next/link";
import { Check, Gift } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-navy">Simple, one-time pricing</h2>
          <p className="mt-4 text-lg text-gray-600">
            No subscriptions, no recurring charges. Just the tools to protect your
            new home.
          </p>
        </div>

        <div className="mt-14 grid max-w-4xl gap-8 lg:mx-auto lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-navy bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              For Homeowners
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-navy">$189</span>
              <span className="text-gray-500">one-time payment</span>
            </div>
            <p className="mt-4 text-gray-600">
              Full access to document, report, track, and export your warranty
              records.
            </p>
            <ul className="mt-6 space-y-3 text-gray-600">
              {[
                "Unlimited issues & photos",
                "Professional request generator",
                "Appointment & repair tracking",
                "Warranty document storage",
                "Full record export",
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
              Protect My Home
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Gift It to a Buyer
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-navy">$124</span>
              <span className="text-gray-500">one-time payment</span>
            </div>
            <p className="mt-4 text-gray-600">
              A useful closing gift for new-construction buyers. No setup required
              before redemption.
            </p>
            <ul className="mt-6 space-y-3 text-gray-600">
              {[
                "Everything in the homeowner plan",
                "Branded gift email & redemption",
                "Co-branded partner page",
                "Gift status tracking",
                "No partner access to issues",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/checkout?product=gift"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border-2 border-navy py-4 text-center text-lg font-semibold text-navy hover:bg-navy hover:text-white"
            >
              <Gift className="h-5 w-5" />
              Gift It to a Buyer
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          30-day satisfaction guarantee. No subscription.
        </p>
      </div>
    </section>
  );
}
