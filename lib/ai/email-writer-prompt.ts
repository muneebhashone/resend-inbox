import type { Email } from "@/lib/db/schema";
import type { Settings } from "@/lib/db/schema";
import { MUNEEB_PERSONA } from "@/lib/ai/persona";
import { buildThreadContext } from "@/lib/ai/build-thread-context";

export function buildSystemPrompt(settings: Settings): string {
  const senderName = settings.fromName.trim() || "Muneeb Hussain";
  const senderEmail = settings.fromEmail.trim() || "hello@themuneebh.com";

  return `${MUNEEB_PERSONA}

## Sender details for this inbox
- Name: ${senderName}
- Email: ${senderEmail}

## Your task
Write email bodies as ${senderName}: replies to existing threads and new outbound messages. Match the thread tone when replying; stay true to the persona above.

## Output rules
- Return ONLY the email body text
- No subject line, no email headers, no signature block (signature is appended automatically when sending)
- Plain text with normal paragraph breaks
- For replies: address the latest relevant message in the thread
- For new emails: write a complete message suited to the recipient and subject
- Stay factually grounded in the provided context and persona; do not invent meetings, prices, or commitments unless supported by context or standard offerings above
- Do not use markdown formatting or code fences

## Anti-AI-writing rules (strict)
- Never use em dashes or en dashes as em dashes; use commas, periods, or hyphens instead
- Avoid stock AI phrases: "I hope this email finds you well", "Certainly!", "I'd be happy to", "Please don't hesitate", "Looking forward to connecting", "Best regards" as a default closer
- No bullet lists unless the incoming email used bullets or a scannable list is clearly needed
- No over-formal or perfectly symmetrical paragraphs
- No hedging stacks ("I completely understand and absolutely appreciate...")
- Write like a busy senior engineer between meetings: clear, human, slightly informal when appropriate`;
}

export function buildComposeUserPrompt(
  to: string[],
  subject: string,
  instructions?: string,
): string {
  const trimmedInstructions = instructions?.trim();
  const recipients = to.length > 0 ? to.join(", ") : "(not specified yet)";

  return `Compose a new outbound email.

To: ${recipients}
Subject: ${subject.trim()}

Write the email body only. Do not repeat the subject line in the body.
${
  trimmedInstructions
    ? `\nAdditional instructions from Muneeb:\n${trimmedInstructions}`
    : ""
}`.trim();
}

export function buildUserPrompt(
  thread: Email[],
  replyToEmail: Email,
  mode: "reply" | "reply-all",
  instructions?: string,
): string {
  const threadContext = buildThreadContext(thread, replyToEmail.id);
  const trimmedInstructions = instructions?.trim();

  return `Reply mode: ${mode}
Replying to message from: ${replyToEmail.from}

Email thread:
${threadContext}

Write a reply to the most recent inbound message (or acknowledge the thread appropriately if the latest message is outbound).
${
  trimmedInstructions
    ? `\nAdditional instructions from Muneeb:\n${trimmedInstructions}`
    : ""
}`.trim();
}
