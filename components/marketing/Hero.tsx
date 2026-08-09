import Link from "next/link";
import { CheckCircle2, ShieldCheck, Clock, Gift } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy pb-20 pt-12 text-white lg:pt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-green">
              For Homeowners
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
              Your new-home warranty has deadlines.
            </h1>
            <p className="mt-4 text-2xl font-medium text-white/90">
              Make sure nothing gets forgotten.
            </p>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Capture issues with photos and dates, create professional warranty
              requests, track every repair, and keep a complete record you
              control.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/checkout?product=homeowner"
                className="rounded-full bg-green px-8 py-4 text-center text-lg font-semibold text-white hover:bg-green-600"
              >
                Protect My Home — $189
              </Link>
              <Link
                href="/checkout?product=gift"
                className="rounded-full border border-white/30 bg-white/5 px-8 py-4 text-center text-lg font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Give a Gift — $124
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green" /> One-time payment
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green" /> Your data
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green" /> Your records
              </li>
            </ul>
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
