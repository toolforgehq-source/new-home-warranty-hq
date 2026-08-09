import { Camera, FileCheck, TrendingUp, ShieldCheck } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Document it",
    body: "Capture issues with photos, dates, location, and relevant details.",
    icon: Camera,
  },
  {
    step: "02",
    title: "Report it",
    body: "Generate a professional builder-ready warranty request.",
    icon: FileCheck,
  },
  {
    step: "03",
    title: "Track it",
    body: "Monitor builder responses, appointments, promises, and repair progress.",
    icon: TrendingUp,
  },
  {
    step: "04",
    title: "Confirm it",
    body: "Verify whether the repair actually resolved the issue before closing the item.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-navy">
            Four simple steps to protect your new home
          </h2>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.title} className="relative rounded-2xl bg-gray-50 p-6">
              <span className="text-5xl font-bold text-gray-200">
                {item.step}
              </span>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy">
                {item.title}
              </h3>
              <p className="mt-2 text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
