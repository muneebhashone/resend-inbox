import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import type { EmailAction } from "@/lib/types";

export async function applyThreadAction(
  threadIds: string[],
  action: EmailAction,
) {
  if (threadIds.length === 0) return { updated: 0 };

  const uniqueIds = [...new Set(threadIds)];
  const patch = (() => {
    switch (action) {
      case "archive":
        return { isArchived: true };
      case "unarchive":
        return { isArchived: false };
      case "trash":
        return { deletedAt: new Date() };
      case "restore":
        return { deletedAt: null, isArchived: false };
      case "star":
        return { isStarred: true };
      case "unstar":
        return { isStarred: false };
      case "read":
        return { isRead: true };
      case "unread":
        return { isRead: false };
    }
  })();

  await db.update(emails).set(patch).where(inArray(emails.threadId, uniqueIds));

  return { updated: uniqueIds.length };
}

export async function applyEmailStar(emailId: string, isStarred: boolean) {
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });
  if (!email) return null;

  await db
    .update(emails)
    .set({ isStarred })
    .where(eq(emails.threadId, email.threadId));

  return email.threadId;
}
