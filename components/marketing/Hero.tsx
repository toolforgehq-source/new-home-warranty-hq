import Link from "next/link";
import { CheckCircle2, ShieldCheck, BadgeDollarSign, Lock, Gift } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy pb-20 pt-12 text-white lg:pt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green">
              For New-Construction Homeowners
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
              Your builder warranty has deadlines.
            </h1>
            <p className="mt-4 text-2xl font-medium text-white/90">
              Stay ahead of every one.
            </p>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Keep every warranty issue, photo, builder message, appointment, and
              repair in one organized place&mdash;so nothing gets forgotten
              before an important warranty deadline passes.
            </p>

            <div className="mt-8">
              <Link
                href="/checkout?product=homeowner"
                className="inline-block w-full rounded-full bg-green px-8 py-4 text-center text-lg font-semibold text-white hover:bg-green-600 sm:w-auto"
              >
                Start My Warranty HQ — $189
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green" /> 30-day money-back guarantee
              </li>
              <li className="flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4 text-green" /> One-time payment
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green" /> No subscription
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green" /> Private by default
              </li>
            </ul>

            <p className="mt-6 text-sm text-white/60">
              Buying for a client?{" "}
              <Link href="/partners" className="font-medium text-white underline-offset-4 hover:underline">
                Gift New Home Warranty HQ &rarr;
              </Link>
            </p>

            <div className="mt-8 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
              <p className="font-semibold text-white">Not another home warranty.</p>
              <p className="mt-1 text-sm text-white/70">
                New Home Warranty HQ helps you manage the builder warranty you
                already have.
              </p>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <ProductPreview />
          </div>
        </div>
      </div>

      <div className="mt-12 px-6 lg:hidden">
        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="rounded-2xl bg-white p-2 shadow-2xl">
        <div className="rounded-xl bg-gray-50 p-6 text-navy">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-navy px-2 py-1 text-xs font-semibold text-white">
              Example dashboard
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">
                WARRANTY ACTION PLAN
              </p>
              <h3 className="mt-1 text-lg font-bold">123 Maple Drive</h3>
              <p className="text-sm text-gray-500">Closed 42 days ago</p>
            </div>
            <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
              <p className="text-xs text-green-600">Open Issues</p>
              <p className="text-2xl font-bold text-green">3</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {["Open", "Submitted", "Scheduled", "Resolved"].map((label) => (
              <div
                key={label}
                className="rounded-lg bg-white p-3 text-center shadow-sm"
              >
                <p className="text-xl font-bold">{label === "Resolved" ? 1 : label === "Open" ? 3 : 2}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="h-12 w-12 rounded bg-gray-200" />
              <div className="flex-1">
                <p className="font-semibold">Leaky kitchen faucet</p>
                <p className="text-sm text-gray-500">Kitchen • Open</p>
              </div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                Open
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="h-12 w-12 rounded bg-gray-200" />
              <div className="flex-1">
                <p className="font-semibold">Cracked driveway concrete</p>
                <p className="text-sm text-gray-500">Concrete • Submitted</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                Submitted
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-4 hidden w-48 rounded-2xl border-4 border-white bg-navy shadow-2xl xl:block">
        <div className="p-4 text-white">
          <p className="text-xs font-semibold text-green">REPORT AN ISSUE</p>
          <div className="mt-3 rounded-lg bg-white/10 p-3">
            <Gift className="h-5 w-5 text-green" />
            <p className="mt-2 text-sm font-medium">Take a photo and track it</p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-3/4 rounded bg-white/20" />
            <div className="h-2 w-1/2 rounded bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
