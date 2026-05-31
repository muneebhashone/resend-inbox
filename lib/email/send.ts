import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { getSettings } from "@/lib/db/settings";
import { getResend } from "@/lib/resend";
import {
  buildReferences,
  computeThreadId,
  generateMessageId,
} from "@/lib/threading";
import { ensureRePrefix, makeSnippet, parseJsonArray } from "@/lib/utils";

type SendEmailInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  replyToEmailId?: string;
  mode?: "reply" | "reply-all" | "compose";
};

export async function sendEmail(input: SendEmailInput) {
  const resend = getResend();
  const config = await getSettings();

  if (!config.fromEmail) {
    throw new Error("Configure your from email in Settings before sending");
  }

  const signature = config.signatureHtml.trim();
  const bodyHtml = signature
    ? `${input.bodyHtml}<br/><br/>${signature}`
    : input.bodyHtml;

  let to = input.to;
  let cc = input.cc ?? [];
  let subject = input.subject;
  let threadId: string | undefined;
  let inReplyTo: string | undefined;
  let references: string | undefined;
  let originalEmailId: string | undefined;

  if (input.replyToEmailId) {
    const original = await db.query.emails.findFirst({
      where: eq(emails.id, input.replyToEmailId),
    });

    if (!original) {
      throw new Error("Original email not found");
    }

    originalEmailId = original.id;
    threadId = original.threadId;
    inReplyTo = original.messageId;
    references = buildReferences(original.references, original.messageId);
    subject = ensureRePrefix(original.subject);

    const mode = input.mode ?? "reply";
    const originalTo = parseJsonArray(original.to);
    const originalCc = parseJsonArray(original.cc);
    const fromAddress = config.fromEmail.toLowerCase();

    if (mode === "reply") {
      to = [original.from];
      cc = [];
    } else if (mode === "reply-all") {
      to = [original.from];
      cc = [...originalTo, ...originalCc].filter(
        (address) => address.toLowerCase() !== fromAddress,
      );
    }
  }

  const messageId = generateMessageId(config.fromEmail);
  const from = config.fromName
    ? `${config.fromName} <${config.fromEmail}>`
    : config.fromEmail;

  const headers: Record<string, string> = {
    "Message-ID": messageId,
  };

  if (inReplyTo) {
    headers["In-Reply-To"] = inReplyTo;
    headers.References = references ?? inReplyTo;
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    bcc: input.bcc,
    subject,
    html: bodyHtml,
    headers,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to send email");
  }

  const resolvedThreadId =
    threadId ?? computeThreadId(messageId, inReplyTo, references);

  const id = crypto.randomUUID();
  await db.insert(emails).values({
    id,
    resendId: data.id,
    direction: "outbound",
    threadId: resolvedThreadId,
    messageId,
    inReplyTo: inReplyTo ?? null,
    references: references ?? null,
    from,
    to: JSON.stringify(to),
    cc: JSON.stringify(cc),
    bcc: JSON.stringify(input.bcc ?? []),
    subject,
    html: bodyHtml,
    text: null,
    snippet: makeSnippet(bodyHtml, null),
    attachments: "[]",
    isRead: true,
    createdAt: new Date(),
  });

  if (originalEmailId) {
    await db
      .update(emails)
      .set({ isRead: true })
      .where(eq(emails.id, originalEmailId));
  }

  return { id, resendId: data.id };
}
