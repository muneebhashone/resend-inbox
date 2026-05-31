import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import {
  getThreadEmails,
  markThreadRead,
  serializeEmail,
} from "@/lib/email/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, id),
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const threadEmails = await getThreadEmails(email.threadId);

  return NextResponse.json({
    email: serializeEmail(email),
    thread: threadEmails.map(serializeEmail),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { isRead?: boolean };

  const email = await db.query.emails.findFirst({
    where: eq(emails.id, id),
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (body.isRead === true) {
    await markThreadRead(email.threadId);
  } else if (body.isRead === false) {
    await db.update(emails).set({ isRead: false }).where(eq(emails.id, id));
  }

  const updated = await db.query.emails.findFirst({
    where: eq(emails.id, id),
  });

  return NextResponse.json({ email: updated ? serializeEmail(updated) : null });
}
