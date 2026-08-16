"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePartnerProfile } from "@/lib/actions/partner";

const partnerTypeLabels: Record<string, string> = {
  REALTOR: "Realtor",
  LENDER: "Lender",
  TITLE: "Title / closing company",
  INSPECTOR: "Inspector",
  OTHER: "Other approved partner",
};

export function PartnerProfileEditForm({
  profile,
  email,
}: {
  profile: {
    company?: string | null;
    partnerType: string;
    phone?: string | null;
    photoUrl?: string | null;
    logoUrl?: string | null;
  };
  email: string;
}) {
  const [state, action, pending] = useActionState(updatePartnerProfile, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-navy">
          Company name
        </label>
        <input
          id="company"
          name="company"
          type="text"
          defaultValue={profile.company ?? ""}
          placeholder="Your company or team name"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div>
        <label htmlFor="partnerType" className="block text-sm font-medium text-navy">
          Partner type
        </label>
        <input
          id="partnerType"
          type="text"
          disabled
          value={partnerTypeLabels[profile.partnerType] || profile.partnerType}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy">
          Email
        </label>
        <input
          id="email"
          type="email"
          disabled
          value={email}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-navy">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="(555) 123-4567"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
      </div>

      <div>
        <label htmlFor="photoUrl" className="block text-sm font-medium text-navy">
          Profile photo URL
        </label>
        <input
          id="photoUrl"
          name="photoUrl"
          type="url"
          defaultValue={profile.photoUrl ?? ""}
          placeholder="https://example.com/photo.jpg"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional. Link to a square headshot or team photo.
        </p>
      </div>

      <div>
        <label htmlFor="logoUrl" className="block text-sm font-medium text-navy">
          Company logo URL
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={profile.logoUrl ?? ""}
          placeholder="https://example.com/logo.png"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional. Link to a transparent PNG or SVG logo.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Profile saved.</div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green px-6 py-2.5 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        <Link
          href="/partner/dashboard"
          className="rounded-full px-6 py-2.5 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
