"use client";

import { FormEvent, useState } from "react";

type ComposeModalProps = {
  open: boolean;
  signatureHtml: string;
  onClose: () => void;
  onSent: () => void;
};

export function ComposeModal({
  open,
  signatureHtml,
  onClose,
  onSent,
}: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to.split(",").map((value) => value.trim()).filter(Boolean),
        subject,
        bodyHtml,
        mode: "compose",
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to send email");
      setLoading(false);
      return;
    }

    setTo("");
    setSubject("");
    setBodyHtml("");
    setLoading(false);
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compose</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">To</label>
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="recipient@example.com, another@example.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              value={bodyHtml}
              onChange={(event) => setBodyHtml(event.target.value)}
              rows={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>

          {signatureHtml ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Signature preview
              </p>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
