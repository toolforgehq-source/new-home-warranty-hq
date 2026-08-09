"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerPartner } from "@/lib/actions/partner";

const partnerTypes = [
  { value: "REALTOR", label: "Realtor" },
  { value: "LENDER", label: "Lender" },
  { value: "TITLE", label: "Title / closing company" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "OTHER", label: "Other approved partner" },
];

export default function PartnerRegisterPage() {
  const [state, action, pending] = useActionState(registerPartner, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-navy">
          NEW HOME WARRANTY <span className="text-green">HQ</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-navy">Partner registration</h1>
        <p className="mt-2 text-sm text-gray-600">
          Register to give New Home Warranty HQ as a $124 closing gift.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <input
            name="name"
            type="text"
            required
            placeholder="Full name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <input
            name="company"
            type="text"
            placeholder="Company name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <select
            name="partnerType"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          >
            {partnerTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-navy py-3 font-semibold text-white hover:bg-navy-700 disabled:opacity-70"
          >
            {pending ? "Creating..." : "Create partner account"}
          </button>
        </form>
      </div>
    </div>
  );
}
