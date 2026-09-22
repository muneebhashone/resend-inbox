import { NextResponse } from "next/server";
import { parseBookingWelcome, verifyCalSignature } from "@/lib/booking/cal";
import { sendBookingWelcome } from "@/lib/booking/welcome";

export async function POST(request: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  const eventTypeId = Number(process.env.CAL_EVENT_TYPE_ID);
  if (!secret || !Number.isSafeInteger(eventTypeId) || eventTypeId <= 0) {
    return NextResponse.json({ error: "Cal.com webhook is not configured" }, { status: 503 });
  }

  const body = await request.text();
  if (body.length > 256_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  if (!verifyCalSignature(body, request.headers.get("x-cal-signature-256"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const booking = parseBookingWelcome(event, eventTypeId);
  if (!booking) return NextResponse.json({ received: true, ignored: true });

  try {
    const result = await sendBookingWelcome(booking);
    if (result === "busy") {
      return NextResponse.json({ error: "Booking welcome is being processed" }, { status: 503 });
    }
    if (result === "uncertain") {
      console.error("Booking welcome needs reconciliation", { bookingUid: booking.uid });
      return NextResponse.json({ received: true, status: "needs_reconciliation" });
    }
    return NextResponse.json({ received: true, status: result });
  } catch (error) {
    console.error("Booking welcome failed", { bookingUid: booking.uid, error });
    return NextResponse.json({ error: "Failed to send booking welcome" }, { status: 503 });
  }
}
