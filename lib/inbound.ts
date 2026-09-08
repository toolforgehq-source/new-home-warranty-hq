import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { IssueCommentDirection } from "@prisma/client";
import { trackEvent } from "@/lib/analytics";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const inboundDomain = process.env.INBOUND_EMAIL_DOMAIN || "newhomewarrantyhq.com";
export const fromEmail = process.env.RESEND_FROM_EMAIL || "New Home Warranty HQ <hello@newhomewarrantyhq.com>";

export function getIssueReplyAddress(issueId: string, domain = inboundDomain) {
  return `issue-${issueId}@${domain}`;
}

export function parseIssueIdFromEmail(to: string, domain = inboundDomain): string | null {
  const address = to.toLowerCase().trim();
  const parts = address.split("@");
  if (parts.length !== 2) return null;
  const [localPart, host] = parts;
  if (host !== domain.toLowerCase()) return null;
  if (!localPart.startsWith("issue-")) return null;
  return localPart.replace("issue-", "");
}

export function parseEmailAddress(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/<([^>]+)>/);
  return match ? match[1] : cleaned;
}

function decodeDataUri(input: string | null): string | null {
  if (!input || !input.startsWith("data:")) return input;
  const commaIndex = input.indexOf(",");
  if (commaIndex === -1) return input;
  const base64 = input.slice(commaIndex + 1);
  const header = input.slice(0, commaIndex);
  if (header.includes(";base64")) {
    try {
      return Buffer.from(base64, "base64").toString("utf-8");
    } catch {
      return input;
    }
  }
  try {
    return decodeURIComponent(base64);
  } catch {
    return base64;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface InboundEmail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  text: string | null;
  html: string | null;
  attachments: InboundAttachment[];
}

interface InboundAttachment {
  id: string;
  filename: string | null;
  content_type: string;
  content_disposition: string | null;
}

function findReplyBody(email: InboundEmail): string {
  const text = decodeDataUri(email.text);
  const html = decodeDataUri(email.html);
  if (text) return text;
  if (html) return stripHtml(html);
  return "[No content]";
}

async function getAttachmentPaths(emailId: string, attachments: InboundAttachment[]) {
  if (!resend || !attachments.length) return [];
  const paths: { filename: string; path: string; contentType?: string }[] = [];
  for (const a of attachments) {
    try {
      const { data } = await resend.emails.receiving.attachments.get({ emailId, id: a.id });
      const attachment = data as { download_url?: string } | null;
      if (attachment?.download_url) {
        paths.push({
          filename: a.filename || "attachment",
          path: attachment.download_url,
          contentType: a.content_type,
        });
      }
    } catch (e) {
      console.error("[inbound] failed to get attachment", a.id, e);
    }
  }
  return paths;
}

interface InboundWebhookEvent {
  type: string;
  data?: {
    email_id?: string;
  };
}

export async function processInboundEmail(event: InboundWebhookEvent) {
  if (!resend) return { skipped: true, reason: "Resend not configured" };
  if (event.type !== "email.received") return { skipped: true, reason: "Not email.received" };

  const emailId = event.data?.email_id;
  if (!emailId) return { skipped: true, reason: "No email_id" };

  const { data: email, error } = await resend.emails.receiving.get(emailId, { html_format: "data_uri" });
  if (error || !email) {
    console.error("[inbound] failed to retrieve email", emailId, error);
    return { skipped: true, reason: "Failed to retrieve email" };
  }

  const inbound = email as InboundEmail;
  const toAddresses = Array.isArray(inbound.to) ? inbound.to : [inbound.to];
  const matchedTo = toAddresses.find((t) => parseIssueIdFromEmail(t));
  if (!matchedTo) {
    return { skipped: true, reason: "No issue address found in to" };
  }

  const issueId = parseIssueIdFromEmail(matchedTo);
  if (!issueId) return { skipped: true, reason: "Could not parse issue id" };

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      home: {
        include: {
          primaryOwner: true,
          memberships: { include: { user: true } },
        },
      },
      user: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!issue) {
    return { skipped: true, reason: "Issue not found" };
  }

  const from = (inbound.from || "").trim().toLowerCase();
  const fromName = inbound.from || "Unknown";
  const fromAddress = parseEmailAddress(inbound.from);
  const appEmailAddress = parseEmailAddress(fromEmail);
  const fromOurDomain =
    !!appEmailAddress &&
    (fromAddress === appEmailAddress ||
      from === appEmailAddress ||
      from.endsWith(`<${appEmailAddress}>`));
  if (fromOurDomain) {
    return { skipped: true, reason: "Ignored email from ourselves" };
  }

  const builderEmail = issue.home.builderEmail?.trim().toLowerCase();
  const rawHomeownerEmails = [
    issue.home.primaryOwner?.email,
    issue.user?.email,
    ...issue.home.memberships.map((m) => m.user?.email).filter((e): e is string => Boolean(e)),
  ].filter((e): e is string => Boolean(e));
  const homeownerEmailMap = new Map(rawHomeownerEmails.map((e) => [e.toLowerCase(), e]));
  const homeownerEmails = Array.from(homeownerEmailMap.values());

  const isFromBuilder = builderEmail && (from === builderEmail || fromAddress === builderEmail);
  const isFromHomeowner = homeownerEmails.some((e) => e.toLowerCase() === from || e.toLowerCase() === fromAddress);
  const direction: IssueCommentDirection = isFromBuilder && !isFromHomeowner ? "BUILDER" : "HOMEOWNER";

  const existing = await prisma.issueComment.findUnique({
    where: { externalId: emailId },
  });
  if (existing) {
    return { skipped: true, reason: "Already logged" };
  }

  const content = findReplyBody(inbound);

  await prisma.issueComment.create({
    data: {
      issueId: issue.id,
      direction,
      content,
      emailFrom: fromName,
      externalId: emailId,
    },
  });

  await trackEvent({
    event: "inbound_email_processed",
    userId: issue.userId,
    properties: { issueId: issue.id, direction, from: fromName },
  });

  const attachments = await getAttachmentPaths(emailId, inbound.attachments || []);
  const inboundHtml = decodeDataUri(inbound.html);

  if (direction === "BUILDER") {
    const [to, ...cc] = homeownerEmails;
    if (to) {
      await sendEmail({
        to,
        cc,
        subject: `Re: ${inbound.subject}`,
        text: `${content}\n\n— Forwarded from ${fromName}\nReply to this email to respond directly to your builder. Your message will be logged in New Home Warranty HQ.`,
        html: inboundHtml
          ? `<div style="font-family: sans-serif; padding: 16px;">${inboundHtml}<hr/><p style="color:#666;">Forwarded from ${fromName}<br/>Reply to this email to respond directly to your builder. Your message will be logged in New Home Warranty HQ.</p></div>`
          : undefined,
        replyTo: matchedTo,
        attachments,
      });
    }
  } else if (direction === "HOMEOWNER") {
    const to = issue.home.builderEmail;
    if (to) {
      await sendEmail({
        to,
        cc: homeownerEmails,
        subject: `Re: ${inbound.subject}`,
        text: `${content}\n\n— Forwarded from ${issue.home.primaryOwner?.name || "Homeowner"}\nReply to this email to respond directly to the homeowner. Your message will be logged in New Home Warranty HQ.`,
        html: inboundHtml
          ? `<div style="font-family: sans-serif; padding: 16px;">${inboundHtml}<hr/><p style="color:#666;">Forwarded from ${issue.home.primaryOwner?.name || "Homeowner"}<br/>Reply to this email to respond directly to the homeowner. Your message will be logged in New Home Warranty HQ.</p></div>`
          : undefined,
        replyTo: matchedTo,
        attachments,
      });
    }
  }

  return { ok: true, issueId: issue.id, direction };
}
