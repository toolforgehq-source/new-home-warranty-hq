import {
  Camera,
  FileText,
  Calendar,
  FileSearch,
  Mail,
  Lock,
  Smartphone,
  Download,
} from "lucide-react";

const features = [
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
    title: "Homeowner-controlled builder contact",
    body: "Send from your email, your email app, or copy-ready portal fields.",
    icon: Mail,
  },
  {
    title: "Private and secure",
    body: "Your records are scoped to your home. Partners cannot see your issues.",
    icon: Lock,
  },
  {
    title: "Works beautifully on mobile",
    body: "Report an issue from the job site without a desktop.",
    icon: Smartphone,
  },
  {
    title: "Full record export",
    body: "Download a complete PDF or ZIP of your home records when you need them.",
    icon: Download,
  },
];

export function Features() {
  return (
    <section id="features" className="bg-navy py-20 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Everything you need to stay on top of warranty issues
          </h2>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
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
