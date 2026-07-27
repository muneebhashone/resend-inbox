"use client";

import type { RefObject } from "react";
import { SearchBar } from "@/components/inbox/search-bar";
import { PaperclipIcon } from "@/lib/attachments";
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
    <aside className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCompose}
          className="motion-press rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.97]"
        >
          Compose
        </button>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-900">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`motion-press flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                view === item.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <SearchBar
          query={query}
          searchRef={searchRef}
          senderSuggestions={threads.map((thread) => thread.from)}
          onQueryChange={onQueryChange}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading && threads.length === 0 ? (
          <SkeletonRows />
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            {query
              ? "No conversations match your search."
              : view === "starred"
                ? "No starred conversations."
                : view === "archived"
                  ? "No archived conversations."
                  : "No emails yet. Sync from Resend or wait for new inbound mail."}
          </p>
        ) : (
          threads.map((thread, index) => {
            const selected = thread.id === selectedId;
            const focused = thread.id === focusedId;
            return (
              <div
                key={thread.threadId}
                className={`motion-row-in group relative flex border-b border-zinc-100 transition dark:border-zinc-900 ${
                  selected
                    ? "bg-blue-50 dark:bg-blue-700/10"
                    : focused
                      ? "bg-zinc-100 dark:bg-zinc-900/60"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                }`}
                style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
              >
                {!thread.isRead ? (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-blue-600" />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className="motion-press min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-[13px] ${
                        thread.isRead
                          ? "font-normal text-zinc-700 dark:text-zinc-300"
                          : "font-semibold"
                      }`}
                    >
                      {thread.from}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
                      {thread.hasAttachments ? (
                        <PaperclipIcon className="h-3 w-3 text-zinc-400" />
                      ) : null}
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
                    <p className="truncate text-xs text-zinc-500">
                      {thread.snippet}
                    </p>
                    {thread.unreadCount > 0 ? (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                    {thread.messageCount > 1 ? (
                      <span className="shrink-0 text-xs text-zinc-400">
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
                  className={`motion-press relative shrink-0 px-2 text-sm transition before:absolute before:inset-0 before:content-[''] ${
                    thread.isStarred
                      ? "text-amber-500"
                      : "text-zinc-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100 dark:text-zinc-600"
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
