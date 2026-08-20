"use client";

import { useActionState } from "react";
import { addIssueComment, logBuilderReply } from "@/lib/actions/comment";

export function IssueCommentThread({
  issueId,
  comments,
}: {
  issueId: string;
  comments: {
    id: string;
    direction: string;
    content: string;
    emailFrom: string | null;
    createdAt: Date;
    user: { name: string } | null;
  }[];
}) {
  const [homeownerState, homeownerAction, homeownerPending] = useActionState(addIssueComment, null);
  const [builderState, builderAction, builderPending] = useActionState(logBuilderReply, null);

  const directionStyles: Record<string, string> = {
    HOMEOWNER: "bg-green-50 border-green-200",
    BUILDER: "bg-blue-50 border-blue-200",
    SYSTEM: "bg-gray-50 border-gray-200",
  };

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Communication log</h2>
      <p className="mt-1 text-sm text-gray-600">
        Keep a record of every call, email, and update with your builder.
      </p>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No updates yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-xl border p-4 text-sm ${directionStyles[comment.direction] ?? "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize text-navy">
                  {comment.direction.toLowerCase()}
                  {comment.user && ` — ${comment.user.name}`}
                  {comment.emailFrom && ` — ${comment.emailFrom}`}
                </span>
                <span className="text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-navy">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={homeownerAction} className="mt-6 space-y-3">
        <input type="hidden" name="issueId" value={issueId} />
        <label htmlFor="homeowner-comment" className="block text-sm font-medium text-navy">
          Add an update
        </label>
        <textarea
          id="homeowner-comment"
          name="content"
          rows={3}
          placeholder="Note a call, follow-up, or anything new about this issue."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        {homeownerState?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{homeownerState.error}</div>
        )}
        <button
          type="submit"
          disabled={homeownerPending}
          className="rounded-full bg-green px-6 py-2.5 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
        >
          {homeownerPending ? "Saving..." : "Add update"}
        </button>
      </form>

      <form action={builderAction} className="mt-6 space-y-3 border-t border-gray-100 pt-6">
        <input type="hidden" name="issueId" value={issueId} />
        <label htmlFor="builder-reply" className="block text-sm font-medium text-navy">
          Log a builder reply
        </label>
        <input
          id="builder-reply-from"
          name="emailFrom"
          type="text"
          placeholder="Builder email or name (optional)"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        <textarea
          id="builder-reply"
          name="content"
          rows={3}
          placeholder="Paste or summarize what the builder said."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        {builderState?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{builderState.error}</div>
        )}
        <button
          type="submit"
          disabled={builderPending}
          className="rounded-full bg-white px-6 py-2.5 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-70"
        >
          {builderPending ? "Saving..." : "Log builder reply"}
        </button>
      </form>
    </div>
  );
}
