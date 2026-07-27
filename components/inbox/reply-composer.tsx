"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MarkdownEditor } from "@/components/inbox/markdown-editor";
import type { Email } from "@/lib/types";

export type ComposerMode = "reply" | "reply-all" | "forward";

type ReplyComposerProps = {
  emailId: string;
  latestEmail: Email;
  mode: ComposerMode;
  signatureHtml: string;
  disabled?: boolean;
  onSent: () => void;
  onClose: () => void;
};

function buildForwardBody(email: Email) {
  const header = [
    "---------- Forwarded message ---------",
    `From: ${email.from}`,
    `Date: ${new Date(email.createdAt).toLocaleString()}`,
    `Subject: ${email.subject || "(no subject)"}`,
    `To: ${email.to.join(", ")}`,
    "",
  ].join("\n");

  const body = email.text || email.html?.replace(/<[^>]+>/g, " ") || "";
  return `${header}\n${body.trim()}`;
}

function ReplyComposerForm({
  emailId,
  latestEmail,
  mode,
  signatureHtml,
  disabled,
  onSent,
  onClose,
}: ReplyComposerProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instructions, setInstructions] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(mode === "forward");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "forward") {
      setTo("");
      setSubject(
        latestEmail.subject.toLowerCase().startsWith("fwd:")
          ? latestEmail.subject
          : `Fwd: ${latestEmail.subject || "(no subject)"}`,
      );
      setBody(buildForwardBody(latestEmail));
      setExpanded(true);
    } else {
      setTo("");
      setSubject("");
      setBody("");
      setExpanded(false);
    }
    setInstructions("");
    setError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [mode, latestEmail]);

  async function handleDraft() {
    if (mode === "forward") {
      setError("AI draft is available for replies");
      return;
    }

    if (body.trim()) {
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
    setBody(data.bodyText);
    setDrafting(false);
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!body.trim()) return;

    if (mode === "forward") {
      const recipients = to
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (recipients.length === 0 || !subject.trim()) {
        setError("To and subject are required to forward");
        return;
      }
    }

    setSending(true);
    setError("");

    const payload =
      mode === "forward"
        ? {
            to: to.split(",").map((value) => value.trim()).filter(Boolean),
            subject,
            bodyHtml: body,
            replyToEmailId: emailId,
            mode: "forward" as const,
          }
        : {
            bodyHtml: body,
            replyToEmailId: emailId,
            mode,
          };

    const response = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to send");
      setSending(false);
      return;
    }

    setSending(false);
    onSent();
    onClose();
  }

  const busy = sending || drafting;
  const modeLabel =
    mode === "reply-all" ? "Reply all" : mode === "forward" ? "Forward" : "Reply";

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="motion-slide-up max-h-[55dvh] shrink-0 overflow-y-auto overscroll-contain border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950 sm:max-h-none"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{modeLabel}</span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            disabled={busy}
            className="text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 dark:hover:bg-zinc-800"
        >
          Close
        </button>
      </div>

      <div className="space-y-2 p-4 pt-2">
        {mode === "forward" ? (
          <>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="To"
              disabled={disabled || busy}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              disabled={disabled || busy}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </>
        ) : null}

        {mode !== "forward" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Notes for draft (optional)"
              disabled={disabled || busy}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm max-sm:text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={() => void handleDraft()}
              disabled={disabled || busy}
              className="motion-press rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {drafting ? "Drafting..." : "Draft reply"}
            </button>
          </div>
        ) : null}

        <MarkdownEditor
          value={body}
          onChange={setBody}
          disabled={disabled || busy}
          rows={expanded ? 10 : 5}
          textareaRef={textareaRef}
          onSubmit={() => void handleSubmit()}
          placeholder={
            mode === "forward"
              ? "Add a note in Markdown…"
              : "Write your reply in Markdown…"
          }
        />

        {signatureHtml && expanded ? (
          <div className="motion-fade-in rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Signature
            </p>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: signatureHtml }}
            />
          </div>
        ) : null}

        {error ? <p className="motion-fade-in text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between gap-2">
          <p className="hidden text-xs text-zinc-400 sm:block">⌘/Ctrl + Enter to send</p>
          <button
            type="submit"
            disabled={disabled || busy || !body.trim()}
            className="motion-press ml-auto inline-flex min-h-10 items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.97] disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function ReplyComposer({
  emailId,
  latestEmail,
  mode,
  signatureHtml,
  disabled,
  onSent,
  onClose,
}: {
  emailId: string | null;
  latestEmail: Email | null;
  mode: ComposerMode | null;
  signatureHtml: string;
  disabled?: boolean;
  onSent: () => void;
  onClose: () => void;
}) {
  if (!emailId || !latestEmail || !mode) return null;

  return (
    <ReplyComposerForm
      key={`${emailId}-${mode}`}
      emailId={emailId}
      latestEmail={latestEmail}
      mode={mode}
      signatureHtml={signatureHtml}
      disabled={disabled}
      onSent={onSent}
      onClose={onClose}
    />
  );
}
