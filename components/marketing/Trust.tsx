import { ShieldCheck, Lock, Clock, FileCheck } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Built for homeowners",
    body: "You control what gets tracked, stored, and shared. We are not a builder or insurance company.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your home records are scoped to your account. Partners who gift the product cannot see your issues.",
  },
  {
    icon: Clock,
    title: "One-time payment",
    body: "No subscription. No surprise renewals. Pay once and keep your records.",
  },
  {
    icon: FileCheck,
    title: "Professional records",
    body: "Generate builder-ready requests, track every repair, and export everything when you need it.",
  },
];

export function Trust() {
  return (
    <section className="bg-navy py-16 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            Why trust us
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Your warranty records, your way
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-white/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
