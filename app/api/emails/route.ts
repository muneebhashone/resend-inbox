import { desc, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const allEmails = await db
    .select()
    .from(emails)
    .where(
      q
        ? or(
            like(emails.subject, `%${q}%`),
            like(emails.from, `%${q}%`),
            like(emails.snippet, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(desc(emails.createdAt));

  const threadMap = new Map<
    string,
    {
      threadId: string;
      latestEmail: (typeof allEmails)[number];
      unreadCount: number;
      messageCount: number;
    }
  >();

  for (const email of allEmails) {
    const existing = threadMap.get(email.threadId);
    if (!existing) {
      threadMap.set(email.threadId, {
        threadId: email.threadId,
        latestEmail: email,
        unreadCount: email.isRead ? 0 : 1,
        messageCount: 1,
      });
      continue;
    }

    existing.messageCount += 1;
    if (!email.isRead) existing.unreadCount += 1;
  }

  const threads = Array.from(threadMap.values()).sort(
    (a, b) => b.latestEmail.createdAt.getTime() - a.latestEmail.createdAt.getTime(),
  );

  return NextResponse.json({
    threads: threads.map(({ threadId, latestEmail, unreadCount, messageCount }) => ({
      threadId,
      id: latestEmail.id,
      subject: latestEmail.subject,
      from: latestEmail.from,
      snippet: latestEmail.snippet,
      createdAt: latestEmail.createdAt.toISOString(),
      isRead: unreadCount === 0,
      unreadCount,
      messageCount,
      direction: latestEmail.direction,
    })),
  });
}
