"use client";

import { useActionState } from "react";
import { createRepairVerification } from "@/lib/actions/repair-verification";

const statuses = [
  { value: "FULLY_RESOLVED", label: "Yes — fully resolved" },
  { value: "PARTIALLY_RESOLVED", label: "Partially resolved" },
  { value: "NOT_RESOLVED", label: "No — not resolved" },
  { value: "ISSUE_RETURNED", label: "Issue returned" },
  { value: "NEW_DAMAGE", label: "New damage occurred" },
  { value: "NEED_MORE_TIME", label: "Need more time to confirm" },
];

export function RepairVerificationForm({ issueId }: { issueId: string }) {
  const [state, action, pending] = useActionState(createRepairVerification, null);

  return (
    <form action={action} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Verify the repair</h2>
      <p className="mt-1 text-sm text-gray-600">Only you can mark this issue fully resolved.</p>
      <input type="hidden" name="issueId" value={issueId} />

      <div className="mt-4">
        <label htmlFor="status" className="block text-sm font-medium text-navy">
          Was this issue fully resolved?
        </label>
        <select
          id="status"
          name="status"
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium text-navy">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Add after-repair notes and describe anything still needed."
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
        {pending ? "Saving..." : "Submit verification"}
      </button>
    </form>
  );
}
