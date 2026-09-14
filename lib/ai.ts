import prisma from "@/lib/prisma";

export interface SuggestionInput {
  issueId: string;
  builderMessage?: string;
}

export async function generateReplySuggestion({ issueId, builderMessage }: SuggestionInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI reply suggestions are not configured. Set OPENAI_API_KEY.");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      home: true,
      user: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!issue) throw new Error("Issue not found.");

  const visibleComments = issue.comments.filter((c) => !c.isInternal);

  const lastBuilderComment =
    builderMessage ||
    visibleComments
      .filter((c) => c.direction === "BUILDER")
      .slice(-1)[0]?.content ||
    "";

  const threadSummary = visibleComments
    .map((c) => `${c.direction}: ${c.content.slice(0, 200)}${c.content.length > 200 ? "..." : ""}`)
    .join("\n");

  const prompt = `You are a calm, helpful assistant for New Home Warranty HQ, a service that helps homeowners track and resolve new home warranty issues with their builder.

Home address: ${issue.home.address}
Builder: ${issue.home.builderName}
Issue title: ${issue.title}
Issue description: ${issue.description || "N/A"}

Recent communication thread:
${threadSummary || "No messages yet."}

The builder just said:
"""
${lastBuilderComment || "[No message provided]"}
"""

Write a concise, polite, professional email reply from the homeowner to the builder. Keep it to 2-4 short paragraphs, address the builder's points, and suggest a clear next step. Do not include a signature or subject line.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You draft professional homeowner replies to builders for warranty issues." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const suggestion = data.choices?.[0]?.message?.content?.trim();
  if (!suggestion) throw new Error("No suggestion generated.");
  return suggestion;
}
