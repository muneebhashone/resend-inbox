"use client";

import { useEffect, useState } from "react";
import { AttachmentList } from "@/components/inbox/attachment-list";
import { PaperclipIcon } from "@/lib/attachments";
import type { Email } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";

type EmailViewProps = {
  email: Email | null;
  thread: Email[];
  loading: boolean;
  refreshing?: boolean;
};

function formatRecipients(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match?.[1]?.trim() || from;
}

function EmailBody({ email }: { email: Email }) {
  if (email.html) {
    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.html) }}
      />
    );
  }

  if (email.text) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{email.text}</pre>
    );
  }

  return <p className="text-sm text-zinc-500">No content</p>;
}

function MessageCard({
  message,
  expanded,
  onToggle,
}: {
  message: Email;
  expanded: boolean;
  onToggle: () => void;
}) {
  const outbound = message.direction === "outbound";
  const attached = message.attachments.length > 0;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-zinc-100 px-1 py-2.5 text-left transition hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/40"
      >
        <span className="w-36 shrink-0 truncate text-sm font-medium">
          {displayName(message.from)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-500">
          {message.snippet || "(no preview)"}
        </span>
        {attached ? (
          <PaperclipIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        ) : null}
        <span className="shrink-0 text-xs text-zinc-400">
          {formatShortDate(message.createdAt)}
        </span>
      </button>
    );
  }

  return (
    <article
      className={`border-b border-zinc-100 py-4 dark:border-zinc-900 ${
        outbound ? "pl-2 sm:pl-6" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="mb-3 flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-medium">{message.from}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            To: {formatRecipients(message.to)}
            {message.cc.length > 0 ? ` · Cc: ${formatRecipients(message.cc)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-zinc-500">
          <p className="flex items-center justify-end gap-1.5">
            {attached ? <PaperclipIcon className="h-3.5 w-3.5 text-zinc-400" /> : null}
            {formatShortDate(message.createdAt)}
          </p>
          <p className="mt-0.5">{outbound ? "Sent" : "Received"}</p>
        </div>
      </button>
      <EmailBody email={message} />
      <AttachmentList attachments={message.attachments} />
    </article>
  );
}

export function EmailView({ email, thread, loading, refreshing }: EmailViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (thread.length === 0) {
      setExpandedIds(new Set());
      return;
    }
    const latest = thread[thread.length - 1];
    setExpandedIds(new Set([latest.id]));
  }, [thread]);

  if (!email && loading) {
    return (
      <section className="flex flex-1 flex-col p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-8 space-y-2">
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-3 w-4/6 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      </section>
    );
  }

  if (!email) {
    return (
      <section className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-xs text-center">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No conversation selected
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">
            Choose a thread from the sidebar or press <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 text-xs dark:border-zinc-700 dark:bg-zinc-900">j</kbd> / <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 text-xs dark:border-zinc-700 dark:bg-zinc-900">k</kbd> to navigate
          </p>
        </div>
      </section>
    );
  }

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const threadHasAttachments = thread.some((message) => message.attachments.length > 0);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {refreshing ? (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <div className="inbox-progress-bar h-full w-1/3 bg-blue-500" />
        </div>
      ) : null}

      <div className="shrink-0 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
          <span className="min-w-0 truncate">{email.subject || "(no subject)"}</span>
          {threadHasAttachments ? (
            <PaperclipIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          ) : null}
        </h2>
        {thread.length > 1 ? (
          <p className="mt-1 text-xs text-zinc-500">{thread.length} messages</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        {thread.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            expanded={expandedIds.has(message.id)}
            onToggle={() => toggle(message.id)}
          />
        ))}
      </div>
    </section>
  );
}
