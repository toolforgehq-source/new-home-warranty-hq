import { Camera, FileText, MessagesSquare, CalendarCheck, FolderDown } from "lucide-react";

const steps = [
  {
    icon: Camera,
    label: "1. Capture the issue",
    body: "Snap a photo, pick the room, and note what you're seeing. Takes about 30 seconds.",
    mock: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-gray-200" />
          <div className="h-14 w-14 rounded-lg bg-gray-200" />
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-400">
            + Add
          </div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-500">Title</p>
          <p className="font-semibold">Hairline crack above master bedroom window</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-gray-200 px-2 py-1">Drywall</span>
          <span className="rounded-full bg-gray-200 px-2 py-1">Master bedroom</span>
          <span className="rounded-full bg-gray-200 px-2 py-1">Noticed May 14</span>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    label: "2. Send a professional request",
    body: "One click turns your notes and photos into a clean, builder-ready warranty request and emails it for you.",
    mock: (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">WARRANTY REQUEST</p>
        <p className="mt-1 text-sm">
          Dear Maple Ridge Homes, I am writing to report a warranty item at 123 Maple
          Drive observed on May 14&hellip;
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-1">request.pdf</span>
          <span className="rounded bg-gray-100 px-2 py-1">2 photos</span>
        </div>
        <div className="mt-3 inline-block rounded-full bg-green px-3 py-1.5 text-xs font-semibold text-white">
          Send to builder
        </div>
      </div>
    ),
  },
  {
    icon: MessagesSquare,
    label: "3. Keep the conversation in one place",
    body: "When your builder replies by email, it shows up right in the issue. No digging through your inbox.",
    mock: (
      <div className="space-y-2">
        <div className="ml-6 rounded-lg bg-green/10 p-3 text-sm">
          <p className="text-xs font-semibold text-green">You</p>
          Sent warranty request with 2 photos.
        </div>
        <div className="mr-6 rounded-lg bg-white p-3 text-sm shadow-sm">
          <p className="text-xs font-semibold text-gray-500">Maple Ridge Homes</p>
          Thanks — our drywall crew can look at this next week. Does Tuesday morning work?
        </div>
        <div className="ml-6 rounded-lg bg-green/10 p-3 text-sm">
          <p className="text-xs font-semibold text-green">You</p>
          Tuesday at 9am works. Thank you.
        </div>
      </div>
    ),
  },
  {
    icon: CalendarCheck,
    label: "4. Track the repair to completion",
    body: "Log the appointment, note what was done, and mark it resolved—or reopen it if the fix doesn't hold.",
    mock: (
      <div className="space-y-2 text-sm">
        {[
          ["Reported", "May 14", true],
          ["Sent to builder", "May 14", true],
          ["Appointment", "Tue May 21, 9:00am", true],
          ["Resolved", "Awaiting your confirmation", false],
        ].map(([label, when, done]) => (
          <div key={label as string} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
            <span className="font-medium">{label}</span>
            <span className={done ? "text-xs text-green" : "text-xs text-gray-400"}>{when}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FolderDown,
    label: "5. Own the complete record",
    body: "Every photo, message, date, and document—exportable as a PDF or ZIP whenever you need it.",
    mock: (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">123_Maple_Drive.zip</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>home.json</li>
          <li>warranty-documents/</li>
          <li>issues/Hairline_crack/photos/</li>
          <li>communications/Hairline_crack.txt</li>
          <li>requests/Hairline_crack.pdf</li>
        </ul>
      </div>
    ),
  },
];

export function ProductTour() {
  return (
    <section id="product" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            See what you get
          </p>
          <h2 className="mt-3 text-3xl font-bold text-navy">
            From the first photo to the final record
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Here&apos;s what handling one warranty issue looks like inside New Home Warranty HQ.
          </p>
        </div>

        <div className="mt-14 space-y-12">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                  <step.icon className="h-6 w-6 text-green" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-navy">{step.label}</h3>
                <p className="mt-3 text-lg text-gray-600">{step.body}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-6 text-navy shadow-inner">{step.mock}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
