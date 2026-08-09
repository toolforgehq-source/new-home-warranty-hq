"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createIssue } from "@/lib/actions/issue";

const categories = [
  { value: "EXTERIOR", label: "Exterior" },
  { value: "ROOF", label: "Roof" },
  { value: "SIDING", label: "Siding" },
  { value: "WINDOWS", label: "Windows" },
  { value: "DOORS", label: "Doors" },
  { value: "CONCRETE", label: "Concrete" },
  { value: "FOUNDATION", label: "Foundation" },
  { value: "DRAINAGE", label: "Drainage" },
  { value: "GARAGE", label: "Garage" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BATHROOM", label: "Bathroom" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "HVAC", label: "HVAC" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "FLOORING", label: "Flooring" },
  { value: "CABINETS", label: "Cabinets" },
  { value: "COUNTERTOPS", label: "Countertops" },
  { value: "WALLS_CEILING", label: "Walls / Ceiling" },
  { value: "BASEMENT", label: "Basement" },
  { value: "OTHER", label: "Other" },
];

export default function NewIssuePage() {
  const [state, action, pending] = useActionState(createIssue, null);

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/dashboard/issues" className="text-sm text-gray-500 hover:text-navy">
            &larr; Back to issues
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-navy">Report an Issue</h1>
        <p className="mt-2 text-gray-600">Capture the issue now. You can add details later.</p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-navy">
              Issue title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Leaky kitchen faucet"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-navy">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Kitchen"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-navy">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dateNoticed" className="block text-sm font-medium text-navy">
              Date first noticed
            </label>
            <input
              id="dateNoticed"
              name="dateNoticed"
              type="date"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-navy">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe the issue and anything the builder should know."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-navy">
              <input type="checkbox" name="isRecurring" className="h-4 w-4 accent-green" />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input type="checkbox" name="isWorsening" className="h-4 w-4 accent-green" />
              Getting worse
            </label>
          </div>

          <details className="rounded-lg border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">Previous communication / repair</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="previousCommunication" className="block text-sm font-medium text-navy">
                  Previous communication
                </label>
                <textarea
                  id="previousCommunication"
                  name="previousCommunication"
                  rows={2}
                  placeholder="Notes about any prior emails or calls with the builder."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
                />
              </div>
              <div>
                <label htmlFor="previousRepairAttempt" className="block text-sm font-medium text-navy">
                  Previous repair attempt
                </label>
                <textarea
                  id="previousRepairAttempt"
                  name="previousRepairAttempt"
                  rows={2}
                  placeholder="Has anyone tried to fix this before?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
                />
              </div>
            </div>
          </details>

          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-green py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
          >
            {pending ? "Saving..." : "Save Issue"}
          </button>
        </form>
      </div>
    </main>
  );
}
