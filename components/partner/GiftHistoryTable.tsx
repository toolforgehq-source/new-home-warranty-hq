"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { resendGiftInvitation, sendGiftReceipt } from "@/lib/actions/partner";
import { CopyButton } from "./CopyButton";

const statusStyles: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PAID: "bg-blue-50 text-blue-700",
  REDEEMED: "bg-green-50 text-green-700",
  REFUNDED: "bg-red-50 text-red-700",
};

export function GiftHistoryTable({
  gifts,
  appUrl,
}: {
  gifts: Array<{
    id: string;
    recipientName: string;
    recipientEmail: string;
    propertyAddress: string | null;
    status: string;
    createdAt: string;
    onboardingToken?: { token: string } | null;
  }>;
  appUrl: string;
}) {
  const [resendState, resendAction, resendPending] = useActionState(resendGiftInvitation, null);
  const [receiptState, receiptAction, receiptPending] = useActionState(sendGiftReceipt, null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Gift history</h2>
        <Link
          href="/checkout?product=gift"
          className="rounded-full bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
        >
          Send a gift
        </Link>
      </div>

      {gifts.length === 0 ? (
        <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
          <p className="font-medium text-navy">No gifts sent yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Send your first $124 gift and start tracking buyer redemption here.
          </p>
          <Link
            href="/checkout?product=gift"
            className="mt-4 inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
          >
            Gift It to a Buyer
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-3 font-medium">Recipient</th>
                <th className="pb-3 font-medium">Property</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Sent</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gifts.map((gift) => {
                const redemptionUrl = gift.onboardingToken
                  ? `${appUrl}/onboarding?token=${gift.onboardingToken.token}`
                  : null;

                return (
                  <tr key={gift.id} className="align-top">
                    <td className="py-4 pr-3">
                      <p className="font-medium text-navy">{gift.recipientName}</p>
                      <p className="text-gray-500">{gift.recipientEmail}</p>
                    </td>
                    <td className="py-4 pr-3 text-gray-600">
                      {gift.propertyAddress || "—"}
                    </td>
                    <td className="py-4 pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[gift.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {gift.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 pr-3 text-gray-500">
                      {new Date(gift.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                        {redemptionUrl && gift.status !== "REDEEMED" && gift.status !== "REFUNDED" && (
                          <CopyButton text={redemptionUrl} label="Copy link" />
                        )}
                        {redemptionUrl && gift.status !== "REDEEMED" && gift.status !== "REFUNDED" && (
                          <form action={resendAction} className="contents">
                            <input type="hidden" name="giftId" value={gift.id} />
                            <button
                              type="submit"
                              disabled={resendPending || selectedGift === gift.id}
                              onClick={() => setSelectedGift(gift.id)}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-70"
                            >
                              {resendPending && selectedGift === gift.id ? "Resending..." : "Resend invite"}
                            </button>
                            {resendState?.ok && selectedGift === gift.id && (
                              <span className="text-xs text-green-600">Sent</span>
                            )}
                            {resendState?.error && selectedGift === gift.id && (
                              <span className="text-xs text-red-600">{resendState.error}</span>
                            )}
                          </form>
                        )}
                        <form action={receiptAction} className="contents">
                          <input type="hidden" name="giftId" value={gift.id} />
                          <button
                            type="submit"
                            disabled={receiptPending || selectedGift === gift.id}
                            onClick={() => setSelectedGift(gift.id)}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-70"
                          >
                            {receiptPending && selectedGift === gift.id ? "Sending..." : "Receipt"}
                          </button>
                          {receiptState?.ok && selectedGift === gift.id && (
                            <span className="text-xs text-green-600">Sent</span>
                          )}
                          {receiptState?.error && selectedGift === gift.id && (
                            <span className="text-xs text-red-600">{receiptState.error}</span>
                          )}
                        </form>
                        <Link
                          href={`/checkout?product=gift&recipientName=${encodeURIComponent(gift.recipientName)}&recipientEmail=${encodeURIComponent(gift.recipientEmail)}&propertyAddress=${encodeURIComponent(gift.propertyAddress || "")}`}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                        >
                          Gift again
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
