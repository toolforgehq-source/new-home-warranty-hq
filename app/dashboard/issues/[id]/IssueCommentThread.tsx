"use client";

import { useActionState, useState } from "react";
import { addIssueComment, logBuilderReply } from "@/lib/actions/comment";
import { replyToBuilder, suggestReply } from "@/lib/actions/reply";
import { builderSenderLabel } from "@/lib/issue-progress";

export function IssueCommentThread({
  issueId,
  comments,
  builderName,
  currentUserId,
}: {
  issueId: string;
  builderName: string;
  currentUserId: string;
  comments: {
    id: string;
    direction: string;
    content: string;
    emailFrom: string | null;
    isInternal: boolean;
    createdAt: Date;
    user: { id: string; name: string } | null;
  }[];
}) {
  const [replyState, replyAction, replyPending] = useActionState(replyToBuilder, null);
  const [noteState, noteAction, notePending] = useActionState(addIssueComment, null);
  const [manualState, manualAction, manualPending] = useActionState(logBuilderReply, null);
  const [suggestState, suggestAction, suggestPending] = useActionState(suggestReply, null);

  const [replyContent, setReplyContent] = useState("");


  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-navy">Communication log</h2>
      <p className="mt-1 text-sm text-gray-600">
        Every reply to and from your builder is recorded here. Reply to a builder message and it is emailed directly to them.
      </p>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No updates yet.</p>
      ) : (
        <ul className="mt-4 space-y-2 rounded-2xl bg-gray-50 p-3 sm:p-4">
          {comments.map((comment) => {
            const when = new Date(comment.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            if (comment.direction === "SYSTEM") {
              return (
                <li key={comment.id} className="px-2 py-1 text-center text-xs text-gray-500">
                  {comment.content} &middot; {when}
                </li>
              );
            }

            if (comment.direction === "BUILDER") {
              return (
                <li key={comment.id} className="mr-6 rounded-lg bg-white p-3 text-sm shadow-sm sm:mr-12">
                  <p className="flex justify-between gap-3 text-xs font-semibold text-gray-500">
                    <span title={comment.emailFrom ?? undefined}>
                      {builderSenderLabel(comment.emailFrom, builderName)}
                    </span>
                    <span className="font-normal">{when}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-navy">{comment.content}</p>
                </li>
              );
            }

            const author = !comment.user || comment.user.id === currentUserId ? "You" : comment.user.name;
            return (
              <li
                key={comment.id}
                className={`ml-6 rounded-lg p-3 text-sm sm:ml-12 ${
                  comment.isInternal ? "border border-dashed border-amber-300 bg-amber-50" : "bg-green/10"
                }`}
              >
                <p className="flex justify-between gap-3 text-xs font-semibold">
                  <span className={comment.isInternal ? "text-amber-700" : "text-green-600"}>
                    {author}
                    {comment.isInternal && <span className="font-normal"> &middot; internal note</span>}
                  </span>
                  <span className="font-normal text-gray-500">{when}</span>
                </p>
                <p className="mt-1 whitespace-pre-line text-navy">{comment.content}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form action={replyAction} className="mt-6 space-y-3">
        <input type="hidden" name="issueId" value={issueId} />
        <label htmlFor="builder-reply" className="block text-sm font-medium text-navy">
          Reply to builder
        </label>
        <textarea
          id="builder-reply"
          name="content"
          rows={4}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Type your response to the builder..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        {replyState?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{replyState.error}</div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={replyPending || !replyContent.trim()}
            className="rounded-full bg-green px-6 py-2.5 font-semibold text-white hover:bg-green-600 disabled:opacity-70"
          >
            {replyPending ? "Sending..." : "Send to builder"}
          </button>
          <button
            type="submit"
            formAction={suggestAction}
            disabled={suggestPending}
            className="rounded-full bg-white px-6 py-2.5 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-70"
          >
            {suggestPending ? "Thinking..." : "Suggest a reply"}
          </button>
        </div>
        {suggestState?.suggestion && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
            <p className="font-semibold text-navy">Suggested reply</p>
            <p className="mt-1 whitespace-pre-line text-navy">{suggestState.suggestion}</p>
            <button
              type="button"
              onClick={() => setReplyContent(suggestState.suggestion || "")}
              className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Use this reply
            </button>
          </div>
        )}
        {suggestState?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{suggestState.error}</div>
        )}
      </form>

      <form action={noteAction} className="mt-8 space-y-3 border-t border-gray-100 pt-6">
        <input type="hidden" name="issueId" value={issueId} />
        <input type="hidden" name="isInternal" value="true" />
        <label htmlFor="homeowner-comment" className="block text-sm font-medium text-navy">
          Add an internal note
        </label>
        <textarea
          id="homeowner-comment"
          name="content"
          rows={2}
          placeholder="Note a call, follow-up, or anything new about this issue."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        {noteState?.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{noteState.error}</div>
        )}
        <button
          type="submit"
          disabled={notePending}
          className="rounded-full bg-gray-100 px-6 py-2.5 font-semibold text-navy hover:bg-gray-200 disabled:opacity-70"
        >
          {notePending ? "Saving..." : "Add update"}
        </button>
      </form>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600">Log a builder reply manually</summary>
        <form action={manualAction} className="mt-3 space-y-3">
          <input type="hidden" name="issueId" value={issueId} />
          <input
            name="emailFrom"
            type="text"
            placeholder="Builder email or name (optional)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <textarea
            name="content"
            rows={3}
            placeholder="Paste or summarize what the builder said."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-navy focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          {manualState?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{manualState.error}</div>
          )}
          <button
            type="submit"
            disabled={manualPending}
            className="rounded-full bg-white px-6 py-2.5 font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-70"
          >
            {manualPending ? "Saving..." : "Log builder reply"}
          </button>
        </form>
      </details>
    </div>
  );
}
