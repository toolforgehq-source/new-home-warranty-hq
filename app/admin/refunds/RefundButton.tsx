"use client";

import { useActionState } from "react";
import { processRefund } from "@/lib/actions/refund";

export function RefundButton({ purchaseId, disabled }: { purchaseId: string; disabled?: boolean }) {
  const [state, action] = useActionState(processRefund, null);

  if (state?.ok) {
    return <span className="text-sm text-green">Refunded</span>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="purchaseId" value={purchaseId} />
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
      >
        {disabled ? "Refunded" : "Refund"}
      </button>
    </form>
  );
}
