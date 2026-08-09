import Link from "next/link";
import { Gift, HeartHandshake, Star, Wallet } from "lucide-react";

const benefits = [
  "Useful after closing",
  "Easy to gift",
  "No setup required for the buyer before redemption",
  "One-time payment",
  "Helps the partner stand out",
  "Keeps the partner connected after closing",
];

export function ForPartners() {
  return (
    <section id="for-partners" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green">
              For Partners
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy">
              Give your buyers a gift that protects their new-home experience.
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              New Home Warranty HQ gives new-construction buyers a simple system
              for documenting issues, reporting them, tracking repairs, and
              staying ahead of important warranty dates.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-gray-50 p-8 lg:p-12">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green text-white">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gift a buyer</p>
                  <p className="text-3xl font-bold text-navy">$124</p>
                </div>
              </div>
              <p className="mt-4 text-gray-600">One-time payment. No subscription.</p>
              <ul className="mt-6 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <Star className="h-4 w-4 text-green" /> Branded gift email & redemption page
                </li>
                <li className="flex gap-2">
                  <Wallet className="h-4 w-4 text-green" /> Buyer receives full homeowner access
                </li>
              </ul>
              <Link
                href="/checkout?product=gift"
                className="mt-8 block w-full rounded-full bg-navy py-3.5 text-center font-semibold text-white hover:bg-navy-700"
              >
                Gift It to a Buyer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
