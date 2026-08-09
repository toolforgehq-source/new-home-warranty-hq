import { Eye, FileText, CalendarClock, Search } from "lucide-react";

const problems = [
  {
    icon: Eye,
    title: "It’s easy to overlook",
    body: "Small issues can get forgotten while homeowners are busy settling into the house.",
  },
  {
    icon: FileText,
    title: "Documentation gets scattered",
    body: "Photos, dates, emails, notes, and builder responses often end up in different places.",
  },
  {
    icon: CalendarClock,
    title: "It’s hard to follow up",
    body: "Appointments, promised repairs, and builder responses can become difficult to track.",
  },
  {
    icon: Search,
    title: "Details get lost over time",
    body: "Without one complete record, it is easy to forget what was reported and what still needs attention.",
  },
];

export function ProblemCards() {
  return (
    <section id="why-it-matters" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-navy">
            Why warranty issues get missed
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            New homes come with a lot to remember. Without a system, important
            details slip through the cracks.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <item.icon className="h-6 w-6 text-green" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy">
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
