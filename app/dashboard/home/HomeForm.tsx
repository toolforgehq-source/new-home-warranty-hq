"use client";

import { useActionState } from "react";
import { updateHome } from "@/lib/actions/home";
import { COVERAGE_KINDS, COVERAGE_TERM_OPTIONS, formatTerm, type CoverageField } from "@/lib/warranty-windows";

export function HomeForm({
  home,
}: {
  home: {
    id: string;
    address: string;
    builderName: string;
    builderEmail: string | null;
    builderPhone: string | null;
    builderContactName: string | null;
    builderWarrantyPortalUrl: string | null;
    coverageConfirmedAt: Date | null;
  } & Record<CoverageField, number | null>;
}) {
  const [state, action, pending] = useActionState(updateHome, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="homeId" value={home.id} />

      <div>
        <label className="block text-sm font-medium text-navy">Property address</label>
        <p className="mt-1 text-gray-600">{home.address}</p>
      </div>

      <div>
        <label htmlFor="builderName" className="block text-sm font-medium text-navy">
          Builder name <span className="text-red-500">*</span>
        </label>
        <input
          id="builderName"
          name="builderName"
          type="text"
          defaultValue={home.builderName}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div>
        <label htmlFor="builderEmail" className="block text-sm font-medium text-navy">
          Builder email
        </label>
        <input
          id="builderEmail"
          name="builderEmail"
          type="email"
          defaultValue={home.builderEmail ?? ""}
          placeholder="warranty@builder.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <p className="mt-1 text-xs text-gray-500">Used for one-click warranty request emails.</p>
      </div>

      <div>
        <label htmlFor="builderPhone" className="block text-sm font-medium text-navy">
          Builder phone
        </label>
        <input
          id="builderPhone"
          name="builderPhone"
          type="text"
          defaultValue={home.builderPhone ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div>
        <label htmlFor="builderContactName" className="block text-sm font-medium text-navy">
          Builder contact / warranty representative
        </label>
        <input
          id="builderContactName"
          name="builderContactName"
          type="text"
          defaultValue={home.builderContactName ?? ""}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div>
        <label htmlFor="builderWarrantyPortalUrl" className="block text-sm font-medium text-navy">
          Builder warranty portal URL
        </label>
        <input
          id="builderWarrantyPortalUrl"
          name="builderWarrantyPortalUrl"
          type="url"
          defaultValue={home.builderWarrantyPortalUrl ?? ""}
          placeholder="https://builder.com/warranty"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-navy">Builder warranty coverage</legend>
        <p className="text-xs text-gray-500">
          Each term starts on your closing date.{" "}
          {home.coverageConfirmedAt
            ? "You confirmed these terms. We remind you 60 and 14 days before each one ends."
            : "These are common suggested terms, not your confirmed coverage. Check them against your builder\u2019s warranty document, change any that differ, and confirm below to turn on reminders."}
        </p>
        <div className="mt-3 space-y-3">
          {COVERAGE_KINDS.map((kind) => {
            const current = home[kind.field];
            const options =
              current && !COVERAGE_TERM_OPTIONS.includes(current)
                ? [...COVERAGE_TERM_OPTIONS, current].sort((a, b) => a - b)
                : COVERAGE_TERM_OPTIONS;
            return (
              <div key={kind.field} className="sm:flex sm:items-center sm:justify-between sm:gap-4">
                <label htmlFor={kind.field} className="block text-sm text-navy">
                  {kind.label}
                </label>
                <select
                  id={kind.field}
                  name={kind.field}
                  defaultValue={current ?? ""}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20 sm:mt-0 sm:w-48"
                >
                  {options.map((months) => (
                    <option key={months} value={months}>
                      {formatTerm(months)}
                    </option>
                  ))}
                  <option value="">Not covered / not listed</option>
                </select>
              </div>
            );
          })}
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-navy">
          <input
            type="checkbox"
            name="coverageConfirmed"
            defaultChecked={Boolean(home.coverageConfirmedAt)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green focus:ring-green"
          />
          <span>
            These match my builder&apos;s warranty document. Send me reminders before each one ends.
          </span>
        </label>
      </fieldset>

      {state?.error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save home details"}
      </button>
    </form>
  );
}
