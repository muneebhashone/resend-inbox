import { readFile } from "node:fs/promises";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { bookingWelcomeEmails, emails } from "../lib/db/schema";
import { buildSearchFilterFromQuery } from "../lib/search/build-filter";
import { getThreadEmails, serializeEmail } from "../lib/email/queries";
import { syncReceivedEmails } from "../lib/email/ingest";
import { draftCompose, draftReply } from "../lib/ai/draft-reply";
import { getSettings } from "../lib/db/settings";
import { sendEmail } from "../lib/email/send";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function required(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

function recipients(value: string): string[] {
  const list = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (list.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
    throw new Error("Invalid recipient address");
  }
  return list;
}

async function main() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for the live inbox");
  }
  const [command, ...args] = process.argv.slice(2);

  if (command === "search") {
    const q = args.join(" ").trim();
    const rows = await db.select().from(emails)
      .where(and(isNull(emails.deletedAt), q ? buildSearchFilterFromQuery(q) : undefined))
      .orderBy(desc(emails.createdAt)).limit(50);
    console.log(JSON.stringify(rows.map((row) => ({
      id: row.id, threadId: row.threadId, direction: row.direction,
      from: row.from, to: JSON.parse(row.to), subject: row.subject,
      snippet: row.snippet, createdAt: row.createdAt.toISOString(),
    })), null, 2));
    return;
  }

  if (command === "thread") {
    const id = required(args[0], "Email ID or thread ID");
    const email = await db.query.emails.findFirst({ where: eq(emails.id, id) });
    const rows = await getThreadEmails(email?.threadId ?? id);
    console.log(JSON.stringify(rows.map(serializeEmail), null, 2));
    return;
  }

  if (command === "booking-status") {
    const uid = required(args[0], "Booking UID");
    const record = await db.query.bookingWelcomeEmails.findFirst({
      where: eq(bookingWelcomeEmails.bookingUid, uid),
    });
    console.log(JSON.stringify(record ?? null, null, 2));
    return;
  }

  if (command === "sync") {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required to sync");
    console.log(JSON.stringify(await syncReceivedEmails(), null, 2));
    return;
  }

  if (command === "draft") {
    const settings = await getSettings();
    const replyId = option(args, "--reply");
    const instructions = option(args, "--instructions");
    if (replyId) {
      const email = await db.query.emails.findFirst({ where: eq(emails.id, replyId) });
      if (!email) throw new Error("Reply email not found");
      const thread = await getThreadEmails(email.threadId);
      console.log(JSON.stringify(await draftReply({ thread, replyToEmail: email, settings, instructions }), null, 2));
      return;
    }
    const to = recipients(required(option(args, "--to"), "--to"));
    const subject = required(option(args, "--subject"), "--subject");
    console.log(JSON.stringify(await draftCompose({ to, subject, settings, instructions }), null, 2));
    return;
  }

  if (command === "send") {
    if (!args.includes("--confirm")) throw new Error("--confirm is required for sending");
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required to send");
    const bodyHtml = await readFile(required(option(args, "--body-file"), "--body-file"), "utf8");
    const replyId = option(args, "--reply");
    const mode = args.includes("--reply-all") ? "reply-all" : "reply";
    const to = replyId ? [] : recipients(required(option(args, "--to"), "--to"));
    const subject = replyId ? "" : required(option(args, "--subject"), "--subject");
    console.log(JSON.stringify(await sendEmail({ to, subject, bodyHtml, replyToEmailId: replyId, mode: replyId ? mode : "compose" }), null, 2));
    return;
  }

  throw new Error("Usage: inbox <search [query] | thread <id> | booking-status <uid> | sync | draft (--reply <id> | --to <email> --subject <text>) [--instructions <text>] | send --body-file <path> (--reply <id> [--reply-all] | --to <email> --subject <text>) --confirm>");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
