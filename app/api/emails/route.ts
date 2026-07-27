import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hasAttachmentsJson } from "@/lib/attachments";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import type { InboxView } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const view = (searchParams.get("view") ?? "inbox") as InboxView;

  const viewFilter =
    view === "starred"
      ? and(eq(emails.isStarred, true), isNull(emails.deletedAt))
      : view === "archived"
        ? and(eq(emails.isArchived, true), isNull(emails.deletedAt))
        : and(eq(emails.isArchived, false), isNull(emails.deletedAt));

  const searchFilter = q
    ? or(
        like(emails.subject, `%${q}%`),
        like(emails.from, `%${q}%`),
        like(emails.snippet, `%${q}%`),
      )
    : undefined;

  const allEmails = await db
    .select()
    .from(emails)
    .where(and(viewFilter, searchFilter))
    .orderBy(desc(emails.createdAt));

  const threadMap = new Map<
    string,
    {
      threadId: string;
      latestEmail: (typeof allEmails)[number];
      unreadCount: number;
      messageCount: number;
      isStarred: boolean;
      isArchived: boolean;
      hasAttachments: boolean;
    }
  >();

  for (const email of allEmails) {
    const existing = threadMap.get(email.threadId);
    const attached = hasAttachmentsJson(email.attachments);

    if (!existing) {
      threadMap.set(email.threadId, {
        threadId: email.threadId,
        latestEmail: email,
        unreadCount: email.isRead ? 0 : 1,
        messageCount: 1,
        isStarred: email.isStarred,
        isArchived: email.isArchived,
        hasAttachments: attached,
      });
      continue;
    }

    existing.messageCount += 1;
    if (!email.isRead) existing.unreadCount += 1;
    if (email.isStarred) existing.isStarred = true;
    if (email.isArchived) existing.isArchived = true;
    if (attached) existing.hasAttachments = true;
  }

  const threads = Array.from(threadMap.values()).sort(
    (a, b) => b.latestEmail.createdAt.getTime() - a.latestEmail.createdAt.getTime(),
  );

  return NextResponse.json({
    threads: threads.map(
      ({
        threadId,
        latestEmail,
        unreadCount,
        messageCount,
        isStarred,
        isArchived,
        hasAttachments,
      }) => ({
        threadId,
        id: latestEmail.id,
        subject: latestEmail.subject,
        from: latestEmail.from,
        snippet: latestEmail.snippet,
        createdAt: latestEmail.createdAt.toISOString(),
        isRead: unreadCount === 0,
        isStarred,
        isArchived,
        hasAttachments,
        unreadCount,
        messageCount,
        direction: latestEmail.direction,
      }),
    ),
  });
}
