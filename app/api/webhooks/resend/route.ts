import { NextResponse } from "next/server";
import type { EmailReceivedEvent } from "resend";
import { ingestReceivedEmail } from "@/lib/email/ingest";
import { getResend, getWebhookSecret } from "@/lib/resend";

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = getWebhookSecret();

  if (!secret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  let event: EmailReceivedEvent;

  try {
    event = getResend().webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    }) as EmailReceivedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  try {
    await ingestReceivedEmail(event.data.email_id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook ingest failed:", error);
    return NextResponse.json({ error: "Failed to ingest email" }, { status: 500 });
  }
}
