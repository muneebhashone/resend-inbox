"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { MarkdownEditor } from "@/components/inbox/markdown-editor";

type ComposeModalProps = {
  open: boolean;
  signatureHtml: string;
  onClose: () => void;
  onSent: () => void;
};

type ComposeSize = "default" | "expanded" | "minimized";

export function ComposeModal({
  open,
  signatureHtml,
  onClose,
  onSent,
}: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instructions, setInstructions] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState<ComposeSize>("default");
  const toRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setSize("default");
      requestAnimationFrame(() => toRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (size === "expanded") setSize("default");
        else setSize("minimized");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, size]);

  if (!open) return null;

  const busy = sending || drafting;
  const hasDraft = Boolean(to || cc || bcc || subject || body || instructions);

  function reset() {
    setTo("");
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
    setSubject("");
    setBody("");
    setInstructions("");
    setShowAi(false);
    setError("");
    setSize("default");
  }

  function handleClose() {
    if (hasDraft && !window.confirm("Discard this draft?")) return;
    reset();
    onClose();
  }

  async function handleDraft() {
    if (!subject.trim()) {
      setError("Add a subject before drafting");
      return;
    }

    if (body.trim()) {
      const confirmed = window.confirm(
        "Replace your current message with an AI draft?",
      );
      if (!confirmed) return;
    }

    setDrafting(true);
    setError("");

    const response = await fetch("/api/emails/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to.split(",").map((value) => value.trim()).filter(Boolean),
        subject,
        instructions: instructions.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to draft email");
      setDrafting(false);
      return;
    }

    const data = (await response.json()) as { bodyText: string };
    setBody(data.bodyText);
    setDrafting(false);
    requestAnimationFrame(() => bodyRef.current?.focus());
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError("To, subject, and message are required");
      return;
    }

    setSending(true);
    setError("");

    const response = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to.split(",").map((value) => value.trim()).filter(Boolean),
        cc: cc.split(",").map((value) => value.trim()).filter(Boolean),
        bcc: bcc.split(",").map((value) => value.trim()).filter(Boolean),
        subject,
        bodyHtml: body,
        mode: "compose",
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to send email");
      setSending(false);
      return;
    }

    reset();
    setSending(false);
    onSent();
    onClose();
  }

  if (size === "minimized") {
    return (
      <div className="fixed bottom-0 right-4 z-50 w-72 overflow-hidden rounded-t-xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setSize("default")}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
        >
          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
            {subject.trim() || "New Message"}
          </span>
          <span className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                handleClose();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.stopPropagation();
                  handleClose();
                }
              }}
              className="rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              ×
            </span>
          </span>
        </button>
      </div>
    );
  }

  const expanded = size === "expanded";

  return (
    <div
      className={`fixed z-50 flex flex-col overflow-hidden border border-zinc-200 bg-white shadow-2xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/50 ${
        expanded
          ? "inset-3 rounded-xl sm:inset-6"
          : "bottom-0 right-0 w-full rounded-t-xl sm:bottom-0 sm:right-4 sm:w-[560px] sm:rounded-t-xl"
      }`}
      style={expanded ? undefined : { maxHeight: "min(640px, calc(100dvh - 1rem))" }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
          {subject.trim() || "New Message"}
        </h2>
        <button
          type="button"
          onClick={() => setSize("minimized")}
          disabled={busy}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Minimize"
        >
          —
        </button>
        <button
          type="button"
          onClick={() => setSize(expanded ? "default" : "expanded")}
          disabled={busy}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label={expanded ? "Restore" : "Expand"}
        >
          {expanded ? "⌟⌜" : "⌜⌟"}
        </button>
        <button
          type="button"
          onClick={handleClose}
          disabled={busy}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 divide-y divide-zinc-100 dark:divide-zinc-900">
          <RecipientRow
            label="To"
            value={to}
            onChange={setTo}
            inputRef={toRef}
            disabled={busy}
            required
            trailing={
              <div className="flex gap-2 text-xs text-zinc-500">
                {!showCc ? (
                  <button type="button" onClick={() => setShowCc(true)} className="hover:text-zinc-800 dark:hover:text-zinc-200">
                    Cc
                  </button>
                ) : null}
                {!showBcc ? (
                  <button type="button" onClick={() => setShowBcc(true)} className="hover:text-zinc-800 dark:hover:text-zinc-200">
                    Bcc
                  </button>
                ) : null}
              </div>
            }
          />
          {showCc ? (
            <RecipientRow label="Cc" value={cc} onChange={setCc} disabled={busy} />
          ) : null}
          {showBcc ? (
            <RecipientRow label="Bcc" value={bcc} onChange={setBcc} disabled={busy} />
          ) : null}
          <RecipientRow
            label="Subject"
            value={subject}
            onChange={setSubject}
            disabled={busy}
            required
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <MarkdownEditor
            value={body}
            onChange={setBody}
            disabled={busy}
            rows={expanded ? 18 : 10}
            textareaRef={bodyRef}
            onSubmit={() => void handleSubmit()}
            className="min-h-0 flex-1"
            placeholder="Write your message in Markdown… Paste Markdown to auto-format."
          />

          {showAi ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Notes for AI draft (tone, points to cover…)"
                disabled={busy}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm max-sm:text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => void handleDraft()}
                disabled={busy || !subject.trim()}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              >
                {drafting ? "Drafting…" : "Draft"}
              </button>
            </div>
          ) : null}

          {signatureHtml ? (
            <div className="max-h-20 overflow-hidden rounded-lg border border-dashed border-zinc-200 px-3 py-2 opacity-80 dark:border-zinc-800">
              <div
                className="prose prose-sm max-w-none text-xs dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
          <button
            type="submit"
            disabled={busy || !to.trim() || !subject.trim() || !body.trim()}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => setShowAi((value) => !value)}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {showAi ? "Hide AI" : "AI draft"}
          </button>
          <p className="ml-auto hidden text-xs text-zinc-400 sm:block">
            ⌘/Ctrl + Enter to send · Esc to minimize
          </p>
        </div>
      </form>
    </div>
  );
}

function RecipientRow({
  label,
  value,
  onChange,
  disabled,
  required,
  inputRef,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="w-14 shrink-0 text-xs text-zinc-500">{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="min-w-0 flex-1 bg-transparent text-sm max-sm:text-base outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset focus-visible:outline-none"
        placeholder={label === "Subject" ? "" : "email@example.com"}
      />
      {trailing}
    </div>
  );
}
