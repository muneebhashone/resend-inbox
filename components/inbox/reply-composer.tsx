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
  const [mode, setMode] = useState<"reply" | "reply-all">("reply");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!bodyHtml.trim()) return;

    setLoading(true);
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
      setLoading(false);
      return;
    }

    setBodyHtml("");
    setLoading(false);
    onSent();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("reply")}
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
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "reply-all"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          Reply all
        </button>
      </div>

      <textarea
        value={bodyHtml}
        onChange={(event) => setBodyHtml(event.target.value)}
        rows={5}
        placeholder="Write your reply..."
        disabled={disabled || loading}
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
          disabled={disabled || loading || !bodyHtml.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Sending..." : "Send reply"}
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
