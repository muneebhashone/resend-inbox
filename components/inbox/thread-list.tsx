"use client";

import type { ThreadSummary } from "@/lib/types";

type ThreadListProps = {
  threads: ThreadSummary[];
  selectedId: string | null;
  query: string;
  loading: boolean;
  onSelect: (id: string) => void;
  onQueryChange: (query: string) => void;
  onCompose: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ThreadList({
  threads,
  selectedId,
  query,
  loading,
  onSelect,
  onQueryChange,
  onCompose,
}: ThreadListProps) {
  return (
    <aside className="flex w-full max-w-md flex-col border-r border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCompose}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Compose
        </button>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search subject or sender..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-zinc-500">Loading threads...</p>
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No emails yet. Sync from Resend or wait for new inbound mail.
          </p>
        ) : (
          threads.map((thread) => {
            const selected = thread.id === selectedId;
            return (
              <button
                key={thread.threadId}
                type="button"
                onClick={() => onSelect(thread.id)}
                className={`w-full border-b border-zinc-100 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60 ${
                  selected ? "bg-zinc-100 dark:bg-zinc-900" : ""
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm ${thread.isRead ? "font-normal" : "font-semibold"}`}
                  >
                    {thread.from}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatDate(thread.createdAt)}
                  </span>
                </div>
                <div
                  className={`truncate text-sm ${thread.isRead ? "text-zinc-700 dark:text-zinc-300" : "font-medium"}`}
                >
                  {thread.subject || "(no subject)"}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="truncate text-xs text-zinc-500">{thread.snippet}</p>
                  {thread.unreadCount > 0 ? (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      {thread.unreadCount}
                    </span>
                  ) : null}
                  {thread.messageCount > 1 ? (
                    <span className="text-[10px] text-zinc-400">
                      {thread.messageCount} msgs
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
