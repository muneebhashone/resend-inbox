import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails, type EmailAttachment } from "@/lib/db/schema";
import { parseJsonArray } from "@/lib/utils";

export function serializeEmail(email: typeof emails.$inferSelect) {
  return {
    id: email.id,
    resendId: email.resendId,
    direction: email.direction,
    threadId: email.threadId,
    messageId: email.messageId,
    inReplyTo: email.inReplyTo,
    references: email.references,
    from: email.from,
    to: parseJsonArray(email.to),
    cc: parseJsonArray(email.cc),
    bcc: parseJsonArray(email.bcc),
    subject: email.subject,
    html: email.html,
    text: email.text,
    snippet: email.snippet,
    attachments: JSON.parse(email.attachments) as EmailAttachment[],
    isRead: email.isRead,
    isStarred: email.isStarred,
    isArchived: email.isArchived,
    deletedAt: email.deletedAt ? email.deletedAt.toISOString() : null,
    createdAt: email.createdAt.toISOString(),
  };
}

export async function getThreadEmails(threadId: string) {
  return db
    .select()
    .from(emails)
    .where(eq(emails.threadId, threadId))
    .orderBy(emails.createdAt);
}

export async function markThreadRead(threadId: string) {
  await db
    .update(emails)
    .set({ isRead: true })
    .where(eq(emails.threadId, threadId));
}

export async function markThreadUnread(threadId: string) {
  await db
    .update(emails)
    .set({ isRead: false })
    .where(eq(emails.threadId, threadId));
}
