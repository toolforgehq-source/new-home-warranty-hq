import {
  Camera,
  FileText,
  Calendar,
  FileSearch,
  Mail,
  Lock,
  Smartphone,
  Download,
  BellRing,
} from "lucide-react";

const features = [
  {
    title: "Warranty deadline reminders",
    body: "We track your closing date and warranty windows and nudge you before they pass, so you never find out too late.",
    icon: BellRing,
    highlight: true,
  },
  {
    title: "Issue capture from your phone",
    body: "Take photos, add locations, and note details in seconds.",
    icon: Camera,
  },
  {
    title: "Professional warranty requests",
    body: "Generate builder-ready requests with the right language and attachments.",
    icon: FileText,
  },
  {
    title: "Appointment & repair tracking",
    body: "Keep builder promises, trade visits, and completion dates in one timeline.",
    icon: Calendar,
  },
  {
    title: "Warranty document storage",
    body: "Securely upload and access builder warranty, manuals, and addenda.",
    icon: FileSearch,
  },
  {
    title: "Builder messages in one thread",
    body: "Send requests and replies from your dashboard. Builder replies land in the same thread automatically.",
    icon: Mail,
  },
  {
    title: "Private and secure",
    body: "Your records are scoped to your home. Partners cannot see your issues.",
    icon: Lock,
  },
  {
    title: "Works beautifully on mobile",
    body: "Document an issue from your phone while you're standing right in the room.",
    icon: Smartphone,
  },
  {
    title: "Full record export",
    body: "Download a complete PDF or ZIP of your home records when you need them.",
    icon: Download,
  },
] as const;

export function Features() {
  return (
    <section id="features" className="bg-navy py-20 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Everything you need to stay ahead of your warranty
          </h2>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className={
                "highlight" in item
                  ? "rounded-2xl bg-green/15 p-6 ring-1 ring-green sm:col-span-2 lg:col-span-3"
                  : "rounded-2xl bg-white/5 p-6"
              }
            >
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
