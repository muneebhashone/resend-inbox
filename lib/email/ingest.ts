import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails, type EmailAttachment } from "@/lib/db/schema";
import { getResend } from "@/lib/resend";
import { computeThreadId } from "@/lib/threading";
import { getHeader, makeSnippet } from "@/lib/utils";
import { getInboundAuthenticationVerdict } from "./authentication";

type IngestReceivedEmailResult = {
  id: string | null;
  created: boolean;
  filtered: boolean;
};

export async function ingestReceivedEmail(
  emailId: string,
): Promise<IngestReceivedEmailResult> {
  const resend = getResend();
  const { data: email, error } = await resend.emails.receiving.get(emailId);

  if (error || !email) {
    throw new Error(error?.message ?? "Failed to fetch received email");
  }

  const existing = await db.query.emails.findFirst({
    where: eq(emails.resendId, emailId),
  });

  const headers = email.headers ?? {};
  const authentication = getInboundAuthenticationVerdict({
    from: email.from,
    headers,
  });

  if (authentication.filter) {
    if (existing && !existing.deletedAt) {
      await db
        .update(emails)
        .set({ deletedAt: new Date() })
        .where(eq(emails.id, existing.id));
    }

    console.warn("Filtered unauthenticated own-domain email", {
      emailId,
      domain: authentication.domain,
      dmarc: authentication.dmarc,
    });

    return { id: existing?.id ?? null, created: false, filtered: true };
  }

  const inReplyTo = getHeader(headers, "in-reply-to") ?? null;
  const references = getHeader(headers, "references") ?? null;
  const messageId = email.message_id;
  const threadId = computeThreadId(messageId, inReplyTo, references);

  const { data: attachmentList } =
    await resend.emails.receiving.attachments.list({ emailId });

  const attachments: EmailAttachment[] = (attachmentList?.data ?? []).map(
    (attachment) => ({
      id: attachment.id,
      filename: attachment.filename ?? null,
      contentType: attachment.content_type,
      downloadUrl: attachment.download_url,
    }),
  );

  const record = {
    resendId: emailId,
    direction: "inbound" as const,
    threadId,
    messageId,
    inReplyTo,
    references,
    from: email.from,
    to: JSON.stringify(email.to),
    cc: JSON.stringify(email.cc ?? []),
    bcc: JSON.stringify(email.bcc ?? []),
    subject: email.subject,
    html: email.html,
    text: email.text,
    snippet: makeSnippet(email.html, email.text),
    attachments: JSON.stringify(attachments),
    isRead: false,
    createdAt: new Date(email.created_at),
  };

  if (existing) {
    await db.update(emails).set(record).where(eq(emails.id, existing.id));
    return { id: existing.id, created: false, filtered: false };
  }

  const id = crypto.randomUUID();
  await db.insert(emails).values({ id, ...record });
  return { id, created: true, filtered: false };
}

export async function syncReceivedEmails(): Promise<{
  synced: number;
  filtered: number;
  total: number;
}> {
  const resend = getResend();
  let synced = 0;
  let filtered = 0;
  let after: string | undefined;
  let total = 0;

  do {
    const { data, error } = await resend.emails.receiving.list({
      limit: 100,
      after,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to list received emails");
    }

    for (const item of data.data) {
      total += 1;
      const result = await ingestReceivedEmail(item.id);
      if (result.created) synced += 1;
      if (result.filtered) filtered += 1;
    }

    after = data.has_more ? data.data.at(-1)?.id : undefined;
  } while (after);

  return { synced, filtered, total };
}
