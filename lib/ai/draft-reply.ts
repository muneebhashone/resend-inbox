import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import type { Email, Settings } from "@/lib/db/schema";
import {
  buildComposeUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/ai/email-writer-prompt";
import { sanitizeDraft } from "@/lib/ai/sanitize-draft";

export type DraftReplyInput = {
  thread: Email[];
  replyToEmail: Email;
  settings: Settings;
  mode?: "reply" | "reply-all";
  instructions?: string;
};

export type DraftComposeInput = {
  settings: Settings;
  to: string[];
  subject: string;
  instructions?: string;
};

async function generateDraft(
  settings: Settings,
  prompt: string,
): Promise<{ bodyText: string }> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const { text } = await generateText({
    model: deepseek("deepseek-v4-flash"),
    system: buildSystemPrompt(settings),
    prompt,
    temperature: 0.7,
  });

  return { bodyText: sanitizeDraft(text) };
}

export async function draftReply(input: DraftReplyInput): Promise<{ bodyText: string }> {
  const mode = input.mode ?? "reply";

  return generateDraft(
    input.settings,
    buildUserPrompt(
      input.thread,
      input.replyToEmail,
      mode,
      input.instructions,
    ),
  );
}

export async function draftCompose(
  input: DraftComposeInput,
): Promise<{ bodyText: string }> {
  return generateDraft(
    input.settings,
    buildComposeUserPrompt(input.to, input.subject, input.instructions),
  );
}
