import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import type { Email, Settings } from "@/lib/db/schema";
import {
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

export async function draftReply(input: DraftReplyInput): Promise<{ bodyText: string }> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const mode = input.mode ?? "reply";

  const { text } = await generateText({
    model: deepseek("deepseek-v4-flash"),
    system: buildSystemPrompt(input.settings),
    prompt: buildUserPrompt(
      input.thread,
      input.replyToEmail,
      mode,
      input.instructions,
    ),
    temperature: 0.7,
  });

  return { bodyText: sanitizeDraft(text) };
}
