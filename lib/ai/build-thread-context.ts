import type { Email } from "@/lib/db/schema";
import { parseJsonArray, stripHtml } from "@/lib/utils";

const MAX_MESSAGES = 12;
const MAX_BODY_CHARS = 12_000;

function getEmailBody(email: Email): string {
  const text = email.text?.trim();
  if (text) return text;
  if (email.html) return stripHtml(email.html);
  return email.snippet.trim();
}

function formatRecipients(email: Email): string {
  const to = parseJsonArray(email.to).join(", ");
  const cc = parseJsonArray(email.cc);
  if (cc.length === 0) return to;
  return `${to} (cc: ${cc.join(", ")})`;
}

function formatMessage(email: Email, replyToEmailId: string): string {
  const marker =
    email.id === replyToEmailId ? " [REPLY TARGET]" : "";
  const timestamp = email.createdAt.toISOString();
  const direction = email.direction.toUpperCase();

  return `[${timestamp}] ${direction}${marker}
From: ${email.from}
To: ${formatRecipients(email)}
Body:
${getEmailBody(email)}`;
}

export function buildThreadContext(
  thread: Email[],
  replyToEmailId: string,
): string {
  const selected = thread.slice(-MAX_MESSAGES);
  let totalChars = 0;
  const included: Email[] = [];

  for (let index = selected.length - 1; index >= 0; index -= 1) {
    const email = selected[index];
    const bodyLength = getEmailBody(email).length;
    if (included.length > 0 && totalChars + bodyLength > MAX_BODY_CHARS) {
      break;
    }
    included.unshift(email);
    totalChars += bodyLength;
  }

  const omitted = thread.length - included.length;
  const header =
    omitted > 0
      ? `(${omitted} earlier message${omitted === 1 ? "" : "s"} omitted)\n\n`
      : "";

  const subject = included[0]?.subject ?? thread[0]?.subject ?? "";
  const body = included.map((email) => formatMessage(email, replyToEmailId)).join("\n\n---\n\n");

  return `Subject: ${subject}

${header}${body}`;
}
