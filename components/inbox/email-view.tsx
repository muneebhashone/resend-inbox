"use client";

import type { Email } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";

type EmailViewProps = {
  email: Email | null;
  thread: Email[];
  loading: boolean;
};

function formatRecipients(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
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
      <pre className="whitespace-pre-wrap font-sans text-sm">{email.text}</pre>
    );
  }

  return <p className="text-sm text-zinc-500">No content</p>;
}

export function EmailView({ email, thread, loading }: EmailViewProps) {
  if (loading) {
    return (
      <section className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading email...
      </section>
    );
  }

  if (!email) {
    return (
      <section className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Select a conversation to read
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{email.subject || "(no subject)"}</h2>
        <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">From:</span>{" "}
            {email.from}
          </p>
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">To:</span>{" "}
            {formatRecipients(email.to)}
          </p>
          {email.cc.length > 0 ? (
            <p>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Cc:</span>{" "}
              {formatRecipients(email.cc)}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Date:</span>{" "}
            {new Date(email.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {thread.map((message) => (
          <article
            key={message.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{message.from}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(message.createdAt).toLocaleString()}
                  {message.direction === "outbound" ? " · Sent" : " · Received"}
                </p>
              </div>
            </div>
            <EmailBody email={message} />
            {message.attachments.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                {message.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    {attachment.downloadUrl ? (
                      <a
                        href={attachment.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {attachment.filename ?? "Attachment"}
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-500">
                        {attachment.filename ?? "Attachment"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
