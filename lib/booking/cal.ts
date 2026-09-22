import { createHmac, timingSafeEqual } from "node:crypto";

export type BookingWelcome = {
  uid: string;
  name: string;
  email: string;
  context: string;
};

export function verifyCalSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBookingWelcome(event: unknown, eventTypeId: number): BookingWelcome | null {
  const envelope = object(event);
  if (envelope?.triggerEvent !== "BOOKING_CREATED") return null;
  const payload = object(envelope.payload);
  if (!payload || payload.eventTypeId !== eventTypeId || payload.status !== "ACCEPTED") return null;

  const uid = string(payload.uid);
  const attendee = Array.isArray(payload.attendees) ? object(payload.attendees[0]) : null;
  const name = string(attendee?.name);
  const email = string(attendee?.email);
  if (!uid || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const answers: string[] = [];
  const responses = object(payload.responses);
  for (const [key, raw] of Object.entries(responses ?? {})) {
    if (["name", "email", "location", "guests", "attendeePhoneNumber", "rescheduleReason"].includes(key)) continue;
    const response = object(raw);
    if (response?.isHidden === true) continue;
    const value = string(response?.value);
    if (value) answers.push(`${string(response?.label) || key}: ${value}`);
  }
  const notes = string(payload.additionalNotes);
  if (notes && !answers.some((answer) => answer.includes(notes))) answers.push(`Notes: ${notes}`);

  return { uid, name, email, context: answers.join("\n").slice(0, 2000) };
}

export function standardWelcome(name: string, focus?: string): string {
  const firstName = name.split(/\s+/)[0] || name;
  return [
    `Hi ${firstName},`,
    focus
      ? `Thanks for booking. ${focus}`
      : "Thanks for booking. I look forward to hearing more about what you're working on.",
    "If there's something I should read before the call, reply here.",
    "Speak soon,\nMuneeb",
  ].join("\n\n");
}
