import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { draftReply } from "@/lib/ai/draft-reply";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { getSettings } from "@/lib/db/settings";
import { getThreadEmails } from "@/lib/email/queries";

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "AI drafting is not configured. Set DEEPSEEK_API_KEY." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      replyToEmailId?: string;
      mode?: "reply" | "reply-all";
      instructions?: string;
    };

    if (!body.replyToEmailId?.trim()) {
      return NextResponse.json(
        { error: "replyToEmailId is required" },
        { status: 400 },
      );
    }

    const replyToEmail = await db.query.emails.findFirst({
      where: eq(emails.id, body.replyToEmailId),
    });

    if (!replyToEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const [thread, settings] = await Promise.all([
      getThreadEmails(replyToEmail.threadId),
      getSettings(),
    ]);

    const result = await draftReply({
      thread,
      replyToEmail,
      settings,
      mode: body.mode,
      instructions: body.instructions,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Draft failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to draft reply" },
      { status: 500 },
    );
  }
}
