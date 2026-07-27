"use client";

import type { RefObject } from "react";
import type { InboxView, ThreadSummary } from "@/lib/types";

type ThreadListProps = {
  threads: ThreadSummary[];
  selectedId: string | null;
  focusedId: string | null;
  query: string;
  view: InboxView;
  loading: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onSelect: (id: string) => void;
  onQueryChange: (query: string) => void;
  onViewChange: (view: InboxView) => void;
  onCompose: () => void;
  onStarToggle: (thread: ThreadSummary) => void;
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

const VIEWS: { id: InboxView; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "starred", label: "Starred" },
  { id: "archived", label: "Archived" },
];

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-900"
        >
          <div className="mb-2 flex justify-between">
            <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mb-1.5 h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-2.5 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export function ThreadList({
  threads,
  selectedId,
  focusedId,
  query,
  view,
  loading,
  searchRef,
  onSelect,
  onQueryChange,
  onViewChange,
  onCompose,
  onStarToggle,
}: ThreadListProps) {
  return (
    <aside className="flex w-full max-w-md flex-col border-r border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCompose}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Compose
        </button>

        <div className="flex gap-1">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                view === item.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search subject or sender..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && threads.length === 0 ? (
          <SkeletonRows />
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            {view === "starred"
              ? "No starred conversations."
              : view === "archived"
                ? "No archived conversations."
                : "No emails yet. Sync from Resend or wait for new inbound mail."}
          </p>
        ) : (
          threads.map((thread) => {
            const selected = thread.id === selectedId;
            const focused = thread.id === focusedId;
            return (
              <div
                key={thread.threadId}
                className={`group relative flex border-b border-zinc-100 transition dark:border-zinc-900 ${
                  selected
                    ? "bg-zinc-100 dark:bg-zinc-900"
                    : focused
                      ? "bg-zinc-50 dark:bg-zinc-900/50"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                {!thread.isRead ? (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-blue-600" />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-[13px] ${
                        thread.isRead ? "font-normal text-zinc-700 dark:text-zinc-300" : "font-semibold"
                      }`}
                    >
                      {thread.from}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {formatDate(thread.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`truncate text-[13px] ${
                      thread.isRead
                        ? "text-zinc-600 dark:text-zinc-400"
                        : "font-medium text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {thread.subject || "(no subject)"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="truncate text-[11px] text-zinc-500">{thread.snippet}</p>
                    {thread.unreadCount > 0 ? (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                    {thread.messageCount > 1 ? (
                      <span className="shrink-0 text-[10px] text-zinc-400">
                        {thread.messageCount}
                      </span>
                    ) : null}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStarToggle(thread);
                  }}
                  className={`shrink-0 px-2 text-sm transition ${
                    thread.isStarred
                      ? "text-amber-500"
                      : "text-zinc-300 opacity-0 group-hover:opacity-100 dark:text-zinc-600"
                  }`}
                  aria-label={thread.isStarred ? "Unstar" : "Star"}
                >
                  {thread.isStarred ? "★" : "☆"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
