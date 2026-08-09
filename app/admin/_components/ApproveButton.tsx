"use client";

import { useActionState } from "react";
import { approvePartner } from "@/lib/actions/partner";

export function ApproveButton({ partnerProfileId }: { partnerProfileId: string }) {
  const [state, action, pending] = useActionState(approvePartner, null);

  if (state?.ok) {
    return <span className="text-sm font-medium text-green">Approved</span>;
  }

  return (
    <form action={action} className="inline">
      <input type="hidden" name="partnerProfileId" value={partnerProfileId} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Approving..." : "Approve"}
      </button>
    </form>
  );
}
