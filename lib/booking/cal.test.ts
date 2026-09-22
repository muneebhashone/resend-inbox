import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { parseBookingWelcome, standardWelcome, verifyCalSignature } from "./cal.ts";

const payload = {
  triggerEvent: "BOOKING_CREATED",
  payload: {
    uid: "booking-123",
    eventTypeId: 42,
    status: "ACCEPTED",
    attendees: [{ name: "Jane Smith", email: "jane@example.com" }],
    responses: {
      name: { label: "Name", value: "Jane Smith" },
      notes: { label: "What are you working on?", value: "Scaling our platform" },
      hidden: { label: "Internal", value: "ignore", isHidden: true },
    },
  },
};

test("verifies the raw Cal.com body and rejects altered content", () => {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
  assert.equal(verifyCalSignature(body, signature, "test-secret"), true);
  assert.equal(verifyCalSignature(`${body} `, signature, "test-secret"), false);
  assert.equal(verifyCalSignature(body, "bad", "test-secret"), false);
});

test("accepts only confirmed bookings for the configured event and extracts useful answers", () => {
  assert.deepEqual(parseBookingWelcome(payload, 42), {
    uid: "booking-123", name: "Jane Smith", email: "jane@example.com",
    context: "What are you working on?: Scaling our platform",
  });
  assert.equal(parseBookingWelcome(payload, 43), null);
  assert.equal(parseBookingWelcome({ ...payload, triggerEvent: "BOOKING_RESCHEDULED" }, 42), null);
  assert.equal(parseBookingWelcome({ ...payload, payload: { ...payload.payload, status: "PENDING" } }, 42), null);
});

test("standard welcome does not invent details when answers are absent", () => {
  const body = standardWelcome("Jane Smith");
  assert.match(body, /^Hi Jane,/);
  assert.match(body, /reply here/);
  assert.doesNotMatch(body, /Scaling our platform/);
});
