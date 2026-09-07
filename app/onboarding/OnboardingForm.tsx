"use client";

import { useActionState } from "react";
import Link from "next/link";
import { completeOnboarding } from "@/lib/actions/onboarding";

export default function OnboardingForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, null);

  if (!token) {
    return (
      <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
        Missing onboarding token.{" "}
        <Link href="/" className="underline">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field id="name" name="name" label="Your full name" type="text" required />
      <Field id="password" name="password" label="Create password" type="password" required minLength={8} />
      <Field id="address" name="address" label="Property address" type="text" required placeholder="123 Maple Drive" />
      <Field id="closingDate" name="closingDate" label="Closing date" type="date" required />
      <Field id="occupancyDate" name="occupancyDate" label="Occupancy date (optional)" type="date" />
      <Field id="builderName" name="builderName" label="Builder name" type="text" required />
      <Field id="builderEmail" name="builderEmail" label="Builder email (optional, used for warranty requests)" type="email" placeholder="warranty@builder.com" />

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-green py-3.5 text-lg font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Creating account..." : "Create my account"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type,
  required,
  minLength,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
      />
    </div>
  );
}
