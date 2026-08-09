"use client";

import { useActionState } from "react";
import { createSubmissionRecord } from "@/lib/actions/submission";

const methods = [
  { value: "EMAIL", label: "Email" },
  { value: "PORTAL", label: "Builder portal" },
  { value: "PDF", label: "PDF / printed" },
  { value: "MAIL", label: "Mail" },
  { value: "OTHER", label: "Other" },
];

export function SubmissionForm({
  issueId,
  warrantyRequestId,
}: {
  issueId: string;
  warrantyRequestId?: string | null;
}) {
  const [state, action, pending] = useActionState(createSubmissionRecord, null);

  return (
    <form action={action} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Record submission</h2>
      <p className="mt-1 text-sm text-gray-600">
        After you send the request, save how and when it went out.
      </p>
      <input type="hidden" name="issueId" value={issueId} />
      {warrantyRequestId && <input type="hidden" name="warrantyRequestId" value={warrantyRequestId} />}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="method" className="block text-sm font-medium text-navy">
            Method
          </label>
          <select
            id="method"
            name="method"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          >
            {methods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-navy">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            placeholder="e.g. builder@example.com or portal URL"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="confirmationNumber" className="block text-sm font-medium text-navy">
          Confirmation / reference number
        </label>
        <input
          id="confirmationNumber"
          name="confirmationNumber"
          type="text"
          placeholder="Optional"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="block text-sm font-medium text-navy">
          Notes
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="What was sent, when, and any response promised."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      {state?.error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Saving..." : "I submitted this request"}
      </button>
    </form>
  );
}
