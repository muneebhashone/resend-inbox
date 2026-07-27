import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      to?: string[];
      cc?: string[];
      bcc?: string[];
      subject?: string;
      bodyHtml: string;
      replyToEmailId?: string;
      mode?: "reply" | "reply-all" | "compose" | "forward";
    };

    if (!body.bodyHtml?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const needsRecipients =
      !body.replyToEmailId ||
      body.mode === "compose" ||
      body.mode === "forward";

    if (needsRecipients && (!body.to?.length || !body.subject?.trim())) {
      return NextResponse.json(
        { error: "To and subject are required for new emails" },
        { status: 400 },
      );
    }

    const result = await sendEmail({
      to: body.to ?? [],
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject ?? "",
      bodyHtml: body.bodyHtml,
      replyToEmailId: body.replyToEmailId,
      mode: body.mode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Send failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
