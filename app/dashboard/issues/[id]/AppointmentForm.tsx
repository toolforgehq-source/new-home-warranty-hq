"use client";

import { useActionState } from "react";
import { createAppointment } from "@/lib/actions/appointment";

export function AppointmentForm({ issueId, home }: { issueId: string; home?: { builderEmail: string | null } }) {
  const [state, action, pending] = useActionState(createAppointment, null);

  return (
    <form action={action} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Schedule appointment</h2>
      <p className="mt-1 text-sm text-gray-600">Track the builder’s visit and what was promised.</p>
      <input type="hidden" name="issueId" value={issueId} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-navy">
            Appointment date
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
        </div>
        <div>
          <label htmlFor="expectedRepairDate" className="block text-sm font-medium text-navy">
            Expected repair date
          </label>
          <input
            id="expectedRepairDate"
            name="expectedRepairDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input
          name="builderRepresentative"
          type="text"
          placeholder="Builder representative"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <input
          name="trade"
          type="text"
          placeholder="Trade / subcontractor"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="promisedActions" className="block text-sm font-medium text-navy">
          What was promised
        </label>
        <textarea
          id="promisedActions"
          name="promisedActions"
          rows={2}
          placeholder="e.g. Drywall patch and repaint within 5 business days"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="partsOrdered" className="block text-sm font-medium text-navy">
          Parts ordered
        </label>
        <input
          id="partsOrdered"
          name="partsOrdered"
          type="text"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium text-navy">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Anything else to remember about the visit."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <input
          type="checkbox"
          name="proposeToBuilder"
          className="mt-1 h-4 w-4 accent-green"
        />
        <div>
          <p className="text-sm font-medium text-navy">Email this appointment to the builder for confirmation</p>
          <p className="text-xs text-gray-500">
            The builder will receive a confirmation link and can accept the proposed date.
          </p>
          {!home?.builderEmail && (
            <p className="mt-1 text-xs text-amber-600">
              Add a builder email in Home details to use this option.
            </p>
          )}
        </div>
      </label>

      {state?.error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save appointment"}
      </button>
    </form>
  );
}
