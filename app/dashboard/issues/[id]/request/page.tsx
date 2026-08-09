"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import { generateWarrantyRequest, approveRequest } from "@/lib/actions/request";

export default function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [genState, genAction, genPending] = useActionState(generateWarrantyRequest, null);
  const [approveState, approveAction, approvePending] = useActionState(approveRequest, null);

  const request = genState?.request;
  const approved = !!approveState?.ok;

  const mailtoSubject = `Warranty request: ${request?.generatedContent?.split("\n")[2]?.replace("Issue: ", "") || "Home warranty issue"}`;
  const mailtoBody = request?.generatedContent || "";
  const mailtoHref = `mailto:?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/dashboard/issues/${id}`} className="text-sm text-gray-500 hover:text-navy">
          &larr; Back to issue
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-navy">Warranty Request</h1>
        <p className="mt-2 text-gray-600">
          Review the request before sending it to your builder. All builder-facing communication comes from you.
        </p>

        {!request ? (
          <form action={genAction} className="mt-6 space-y-4">
            <input type="hidden" name="issueId" value={id} />
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
            <h2 className="font-semibold text-navy">Preview</h2>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-navy">
              {request.generatedContent}
            </pre>

            {!approved ? (
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
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={mailtoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600"
                >
                  Open in my email app
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(request.generatedContent)}
                  className="rounded-full bg-white px-6 py-3 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
                >
                  Copy to clipboard
                </button>
                <div className="w-full rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-navy">Portal mode</p>
                  <p>Copy these fields if your builder requires an online submission:</p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-gray-500">Description</dt>
                      <dd className="max-h-24 overflow-auto font-medium text-navy">{request.generatedContent}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
