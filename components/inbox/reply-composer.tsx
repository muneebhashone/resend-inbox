"use client";

import { FormEvent, useState } from "react";

type ReplyComposerProps = {
  emailId: string;
  signatureHtml: string;
  disabled?: boolean;
  onSent: () => void;
};

function ReplyComposerForm({
  emailId,
  signatureHtml,
  disabled,
  onSent,
}: ReplyComposerProps) {
  const [bodyHtml, setBodyHtml] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mode, setMode] = useState<"reply" | "reply-all">("reply");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");

  async function handleDraft() {
    if (bodyHtml.trim()) {
      const confirmed = window.confirm(
        "Replace your current reply with an AI draft?",
      );
      if (!confirmed) return;
    }

    setDrafting(true);
    setError("");

    const response = await fetch("/api/emails/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replyToEmailId: emailId,
        mode,
        instructions: instructions.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to draft reply");
      setDrafting(false);
      return;
    }

    const data = (await response.json()) as { bodyText: string };
    setBodyHtml(data.bodyText);
    setDrafting(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!bodyHtml.trim()) return;

    setSending(true);
    setError("");

    const response = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bodyHtml,
        replyToEmailId: emailId,
        mode,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to send reply");
      setSending(false);
      return;
    }

    setBodyHtml("");
    setInstructions("");
    setSending(false);
    onSent();
  }

  const busy = sending || drafting;

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("reply")}
          disabled={busy}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "reply"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => setMode("reply-all")}
          disabled={busy}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "reply-all"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          Reply all
        </button>
        <button
          type="button"
          onClick={() => void handleDraft()}
          disabled={disabled || busy}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {drafting ? "Drafting..." : "Draft reply"}
        </button>
      </div>

      <input
        type="text"
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
        placeholder="Notes for draft (e.g. decline, suggest a call next week)"
        disabled={disabled || busy}
        className="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <textarea
        value={bodyHtml}
        onChange={(event) => setBodyHtml(event.target.value)}
        rows={5}
        placeholder="Write your reply..."
        disabled={disabled || busy}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      {signatureHtml ? (
        <div className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Signature preview
          </p>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: signatureHtml }}
          />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={disabled || busy || !bodyHtml.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {sending ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}

export function ReplyComposer({
  emailId,
  signatureHtml,
  disabled,
  onSent,
}: {
  emailId: string | null;
  signatureHtml: string;
  disabled?: boolean;
  onSent: () => void;
}) {
  if (!emailId) return null;

  return (
    <ReplyComposerForm
      key={emailId}
      emailId={emailId}
      signatureHtml={signatureHtml}
      disabled={disabled}
      onSent={onSent}
    />
  );
}
