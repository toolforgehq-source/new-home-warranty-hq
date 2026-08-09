"use client";

import { useActionState } from "react";
import { createFinalReview } from "@/lib/actions/final-review";

export function CreateFinalReviewButton({ homeId }: { homeId: string }) {
  const [state, action, pending] = useActionState(createFinalReview, null);

  return (
    <form action={action}>
      <input type="hidden" name="homeId" value={homeId} />
      {state?.error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
      >
        {pending ? "Creating..." : "Create final review report"}
      </button>
    </form>
  );
}
