"use client";

import { useActionState } from "react";
import Link from "next/link";
import { generateWarrantyRequest, approveRequest } from "@/lib/actions/request";
import { sendWarrantyRequestToBuilder } from "@/lib/actions/warranty-send";

interface RequestPreview {
  id: string;
  generatedContent: string;
  requestedNextStep: string | null;
  status: string;
}

export function RequestActions({
  issueId,
  home,
  initialRequest,
}: {
  issueId: string;
  home: { builderName: string; builderEmail: string | null };
  initialRequest?: RequestPreview | null;
}) {
  const [genState, genAction, genPending] = useActionState(generateWarrantyRequest, null);
  const [approveState, approveAction, approvePending] = useActionState(approveRequest, null);
  const [sendState, sendAction, sendPending] = useActionState(sendWarrantyRequestToBuilder, null);

  const request = genState?.request || initialRequest;
  const sent = sendState?.ok || request?.status === "SENT";
  const approved = sent || !!approveState?.ok || request?.status === "APPROVED";

  return (
    <>
      {!request ? (
        <form action={genAction} className="mt-6 space-y-4">
          <input type="hidden" name="issueId" value={issueId} />
          <div>
            <label htmlFor="requestedNextStep" className="block text-sm font-medium text-navy">
              Requested next step
            </label>
            <textarea
              id="requestedNextStep"
              name="requestedNextStep"
              rows={3}
              defaultValue="Please inspect and advise on the appropriate warranty process."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
            />
          </div>
          {genState?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{genState.error}</div>
          )}
          <button
            type="submit"
            disabled={genPending}
            className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
          >
            {genPending ? "Generating..." : "Generate Request"}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Preview</h2>
            {request.status === "SENT" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Sent to builder
              </span>
            )}
          </div>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-navy">
            {request.generatedContent}
          </pre>

          {sent ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">
                The request has been sent to the builder. Any reply will go to your email and can be logged in the issue thread.
              </p>
              <Link
                href={`/dashboard/issues/${issueId}`}
                className="inline-block rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600"
              >
                Back to issue
              </Link>
            </div>
          ) : !approved ? (
            <form action={approveAction} className="mt-6 space-y-4">
              <input type="hidden" name="requestId" value={request.id} />
              {approveState?.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{approveState.error}</div>
              )}
              <button
                type="submit"
                disabled={approvePending}
                className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
              >
                {approvePending ? "Approving..." : "Looks good — approve request"}
              </button>
            </form>
          ) : (
            <form action={sendAction} className="mt-6 space-y-4">
              <input type="hidden" name="requestId" value={request.id} />
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
                <p className="mt-1 text-xs text-gray-500">
                  This will be saved to your home details and used as the recipient.
                </p>
              </div>
              {sendState?.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{sendState.error}</div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={sendPending}
                  className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
                >
                  {sendPending ? "Sending..." : "Send to builder"}
                </button>
                <a
                  href={`/api/reports/request/${request.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(request.generatedContent)}
                  className="rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  Copy to clipboard
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
