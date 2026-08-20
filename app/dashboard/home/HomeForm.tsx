"use client";

import { useActionState } from "react";
import { updateHome } from "@/lib/actions/home";

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
  };
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
