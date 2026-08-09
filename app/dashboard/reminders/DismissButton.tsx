"use client";

import { useActionState } from "react";
import { dismissReminder } from "@/lib/actions/reminder";

export function DismissButton({ reminderId }: { reminderId: string }) {
  const [state, action] = useActionState(dismissReminder, null);

  if (state?.ok) {
    return <span className="text-sm text-green">Dismissed</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="id" value={reminderId} />
      <button
        type="submit"
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
      >
        Dismiss
      </button>
    </form>
  );
}
