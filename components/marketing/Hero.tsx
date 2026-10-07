import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Camera,
  CheckCircle2,
  FileText,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const flow = [
  { icon: Camera, label: "Photo" },
  { icon: FileText, label: "Request sent" },
  { icon: MessagesSquare, label: "Builder replies" },
  { icon: Wrench, label: "Repaired" },
];

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
              Don&apos;t let a warranty repair slip past your builder&apos;s deadline.
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Document every issue, send professional requests to your builder,
              and keep replies, appointments, and repairs in one place&mdash;with
              reminders before each warranty window closes.
            </p>

            <ol className="mt-8 flex items-center gap-1.5 text-xs font-medium text-white/90 sm:gap-2 sm:text-sm lg:hidden">
              {flow.map((step, i) => (
                <li key={step.label} className="flex items-center gap-1.5 sm:gap-2">
                  <span className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-center sm:px-3">
                    <step.icon className="h-5 w-5 text-green" />
                    {step.label}
                  </span>
                  {i < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/40" />}
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <Link
                href="/checkout?product=homeowner"
                className="inline-block w-full rounded-full bg-green px-8 py-4 text-center text-lg font-semibold text-white hover:bg-green-600 sm:w-auto"
              >
                Start My Warranty HQ — $189
              </Link>
              <p className="mt-3 text-sm text-white/70">
                One payment covers your entire builder warranty period&mdash;a
                small cost next to the house you just bought.
              </p>
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

const timeline = [
  { label: "Photo & details", when: "May 14", done: true },
  { label: "Request sent to builder", when: "May 14", done: true },
  { label: "Builder replied", when: "May 15", done: true },
  { label: "Repair visit", when: "Tue May 21, 9:00 AM", done: false },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="rounded-2xl bg-white p-2 shadow-2xl">
        <div className="rounded-xl bg-gray-50 p-5 text-navy sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-navy px-2 py-1 text-xs font-semibold text-white">
                Example dashboard
              </span>
              <h3 className="mt-3 text-lg font-bold">123 Maple Drive</h3>
              <p className="text-sm text-gray-500">Closed 42 days ago</p>
            </div>
            <div className="rounded-lg bg-green-50 px-3 py-2 text-right">
              <p className="text-xs text-green-700">Workmanship coverage</p>
              <p className="text-lg font-bold text-green">323 days left</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded bg-gray-200" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">Hairline crack above bedroom window</p>
                <p className="text-sm text-gray-500">Drywall &bull; Scheduled</p>
              </div>
            </div>
            <ol className="mt-4 space-y-2 text-sm">
              {timeline.map((step) => (
                <li key={step.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${step.done ? "text-green" : "text-gray-300"}`} />
                    {step.label}
                  </span>
                  <span className={`text-xs ${step.done ? "text-gray-500" : "font-semibold text-navy"}`}>{step.when}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="text-xs font-semibold text-gray-500">Maple Ridge Homes replied by email</p>
              Our drywall crew can come Tuesday at 9 AM.
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
            <div className="h-10 w-10 shrink-0 rounded bg-gray-200" />
            <div className="flex-1">
              <p className="font-semibold">Cracked driveway concrete</p>
              <p className="text-sm text-gray-500">Concrete &bull; Waiting on builder</p>
            </div>
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
              Submitted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
