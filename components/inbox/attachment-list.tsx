"use client";

import type { EmailAttachment } from "@/lib/types";
import { attachmentLabel } from "@/lib/attachments";

export function AttachmentList({ attachments }: { attachments: EmailAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-900">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {attachments.length === 1
          ? "1 attachment"
          : `${attachments.length} attachments`}
      </p>
      <ul className="flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          const name = attachment.filename ?? "Attachment";
          const label = attachmentLabel(attachment.contentType, attachment.filename);
          const className =
            "inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-left text-sm transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80";

          const inner = (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-700/20 dark:text-blue-400">
                {label}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {name}
                </span>
                {attachment.downloadUrl ? (
                  <span className="block text-xs text-zinc-500">Download</span>
                ) : (
                  <span className="block text-xs text-zinc-400">Unavailable</span>
                )}
              </span>
            </>
          );

          return (
            <li key={attachment.id} className="min-w-0 max-w-full sm:max-w-[16rem]">
              {attachment.downloadUrl ? (
                <a
                  href={attachment.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                  title={name}
                >
                  {inner}
                </a>
              ) : (
                <div className={`${className} opacity-60`} title={name}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
