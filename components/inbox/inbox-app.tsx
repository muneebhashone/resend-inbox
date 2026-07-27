"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActionToolbar } from "@/components/inbox/action-toolbar";
import { ComposeModal } from "@/components/inbox/compose-modal";
import { EmailView } from "@/components/inbox/email-view";
import { useInboxKeyboard } from "@/components/inbox/keyboard-shortcuts";
import {
  ReplyComposer,
  type ComposerMode,
} from "@/components/inbox/reply-composer";
import { ThreadList } from "@/components/inbox/thread-list";
import { UndoToast, type UndoState } from "@/components/inbox/undo-toast";
import type {
  Email,
  EmailAction,
  InboxView,
  Settings,
  ThreadSummary,
} from "@/lib/types";

async function fetchThreads(
  search: string,
  view: InboxView,
): Promise<ThreadSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (view !== "inbox") params.set("view", view);
  const query = params.toString();
  const response = await fetch(`/api/emails${query ? `?${query}` : ""}`);
  const data = (await response.json()) as { threads: ThreadSummary[] };
  return data.threads;
}

async function fetchSettings(): Promise<Settings> {
  const response = await fetch("/api/settings");
  const data = (await response.json()) as { settings: Settings };
  return data.settings;
}

async function fetchEmail(
  id: string,
): Promise<{ email: Email; thread: Email[] } | null> {
  const response = await fetch(`/api/emails/${id}`);
  if (!response.ok) return null;
  return (await response.json()) as { email: Email; thread: Email[] };
}

async function postAction(threadIds: string[], action: EmailAction) {
  await fetch("/api/emails/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadIds, action }),
  });
}

const UNDO_LABELS: Partial<Record<EmailAction, string>> = {
  archive: "Conversation archived",
  trash: "Conversation moved to trash",
  unarchive: "Moved to inbox",
  restore: "Conversation restored",
};

export function InboxApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(threadParam);
  const [focusedId, setFocusedId] = useState<string | null>(threadParam);
  const [email, setEmail] = useState<Email | null>(null);
  const [thread, setThread] = useState<Email[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<InboxView>("inbox");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [refreshingEmail, setRefreshingEmail] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode | null>(null);
  const [mobileDetail, setMobileDetail] = useState(Boolean(threadParam));
  const [undo, setUndo] = useState<UndoState | null>(null);

  const threadCache = useRef(new Map<string, { email: Email; thread: Email[] }>());
  const searchRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const selectedThread = useMemo(
    () => threads.find((item) => item.id === selectedId) ?? null,
    [threads, selectedId],
  );

  const syncUrl = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("thread", id);
      else params.delete("thread");
      const next = params.toString();
      router.replace(next ? `/?${next}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const refreshThreads = useCallback(
    async (search = query, nextView = view, silent = false) => {
      if (!silent) setLoadingThreads(true);
      const nextThreads = await fetchThreads(search, nextView);
      setThreads(nextThreads);
      setLoadingThreads(false);
      return nextThreads;
    },
    [query, view],
  );

  const openEmail = useCallback(async (id: string, options?: { optimisticRead?: boolean }) => {
    const cached = threadCache.current.get(id);
    if (cached) {
      setEmail(cached.email);
      setThread(cached.thread);
      setLoadingEmail(false);
    } else {
      setLoadingEmail(true);
      setRefreshingEmail(true);
    }

    if (options?.optimisticRead !== false) {
      setThreads((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true, unreadCount: 0 } : item,
        ),
      );
    }

    const data = await fetchEmail(id);
    if (data) {
      threadCache.current.set(id, data);
      for (const message of data.thread) {
        threadCache.current.set(message.id, {
          email: message,
          thread: data.thread,
        });
      }
      setEmail(data.email);
      setThread(data.thread);

      if (options?.optimisticRead !== false) {
        void fetch(`/api/emails/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
      }
    }
    setLoadingEmail(false);
    setRefreshingEmail(false);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setFocusedId(id);
      setMobileDetail(true);
      setComposerMode(null);
      syncUrl(id);
      void openEmail(id);
    },
    [openEmail, syncUrl],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setEmail(null);
    setThread([]);
    setMobileDetail(false);
    setComposerMode(null);
    syncUrl(null);
  }, [syncUrl]);

  const showUndo = useCallback((state: UndoState) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(state);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  }, []);

  const runThreadAction = useCallback(
    async (
      threadSummary: ThreadSummary,
      action: EmailAction,
      options?: { undoAction?: EmailAction; advance?: boolean },
    ) => {
      const threadId = threadSummary.threadId;
      const emailId = threadSummary.id;

      // Optimistic list update
      if (action === "archive" || action === "trash") {
        setThreads((current) => current.filter((item) => item.threadId !== threadId));
      } else if (action === "star") {
        setThreads((current) =>
          current.map((item) =>
            item.threadId === threadId ? { ...item, isStarred: true } : item,
          ),
        );
      } else if (action === "unstar") {
        setThreads((current) =>
          view === "starred"
            ? current.filter((item) => item.threadId !== threadId)
            : current.map((item) =>
                item.threadId === threadId ? { ...item, isStarred: false } : item,
              ),
        );
      } else if (action === "unarchive" || action === "restore") {
        setThreads((current) => current.filter((item) => item.threadId !== threadId));
      } else if (action === "unread") {
        setThreads((current) =>
          current.map((item) =>
            item.threadId === threadId
              ? { ...item, isRead: false, unreadCount: Math.max(1, item.unreadCount) }
              : item,
          ),
        );
      } else if (action === "read") {
        setThreads((current) =>
          current.map((item) =>
            item.threadId === threadId
              ? { ...item, isRead: true, unreadCount: 0 }
              : item,
          ),
        );
      }

      const shouldAdvance =
        options?.advance &&
        (action === "archive" || action === "trash" || action === "unread");

      if (shouldAdvance) {
        const index = threads.findIndex((item) => item.id === emailId);
        const next =
          threads[index + 1] ?? threads[index - 1] ?? null;
        if (next && next.id !== emailId) {
          handleSelect(next.id);
        } else {
          clearSelection();
        }
      }

      await postAction([threadId], action);

      if (options?.undoAction) {
        showUndo({
          label: UNDO_LABELS[action] ?? "Action completed",
          threadIds: [threadId],
          undoAction: options.undoAction,
        });
      }
    },
    [clearSelection, handleSelect, showUndo, threads, view],
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    void (async () => {
      const [nextThreads, nextSettings] = await Promise.all([
        fetchThreads("", "inbox"),
        fetchSettings(),
      ]);
      setThreads(nextThreads);
      setSettings(nextSettings);
      setLoadingThreads(false);

      const initialId = threadParam;
      if (initialId) {
        setSelectedId(initialId);
        setFocusedId(initialId);
        setMobileDetail(true);
        void openEmail(initialId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;

    const timeout = setTimeout(() => {
      void refreshThreads(query, view);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, view, refreshThreads]);

  // Background poll
  useEffect(() => {
    async function silentRefresh() {
      const nextThreads = await fetchThreads(query, view);
      setThreads(nextThreads);
      const current = selectedIdRef.current;
      if (current) {
        const stillPresent = nextThreads.some((item) => item.id === current);
        if (stillPresent) {
          const data = await fetchEmail(current);
          if (data) {
            threadCache.current.set(current, data);
            setEmail(data.email);
            setThread(data.thread);
          }
        }
      }
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void silentRefresh();
      }
    }, 30_000);

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void silentRefresh();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [query, view]);

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    await refreshThreads();
    if (selectedId) {
      threadCache.current.delete(selectedId);
      await openEmail(selectedId, { optimisticRead: false });
    }
    setSyncing(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSent() {
    threadCache.current.clear();
    void refreshThreads();
    if (selectedId) {
      void openEmail(selectedId, { optimisticRead: false });
    }
  }

  function handleStarToggle(threadSummary: ThreadSummary) {
    void runThreadAction(
      threadSummary,
      threadSummary.isStarred ? "unstar" : "star",
    );
  }

  function handleArchive() {
    if (!selectedThread) return;
    const action = selectedThread.isArchived ? "unarchive" : "archive";
    void runThreadAction(selectedThread, action, {
      undoAction: selectedThread.isArchived ? "archive" : "unarchive",
      advance: !selectedThread.isArchived,
    });
  }

  function handleTrash() {
    if (!selectedThread) return;
    void runThreadAction(selectedThread, "trash", {
      undoAction: "restore",
      advance: true,
    });
  }

  function handleMarkUnread() {
    if (!selectedThread) return;
    void runThreadAction(selectedThread, "unread", { advance: true });
  }

  function handleStar() {
    if (!selectedThread) return;
    handleStarToggle(selectedThread);
  }

  async function handleUndo() {
    if (!undo) return;
    await postAction(undo.threadIds, undo.undoAction);
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await refreshThreads();
  }

  const moveFocus = useCallback(
    (delta: number) => {
      if (threads.length === 0) return;
      const currentIndex = threads.findIndex(
        (item) => item.id === (focusedId ?? selectedId),
      );
      const nextIndex =
        currentIndex < 0
          ? delta > 0
            ? 0
            : threads.length - 1
          : Math.min(threads.length - 1, Math.max(0, currentIndex + delta));
      const next = threads[nextIndex];
      if (next) {
        setFocusedId(next.id);
        if (selectedId) {
          handleSelect(next.id);
        }
      }
    },
    [focusedId, handleSelect, selectedId, threads],
  );

  const keyboardHandlers = useMemo(
    () => ({
      onNext: () => moveFocus(1),
      onPrev: () => moveFocus(-1),
      onOpen: () => {
        const id = focusedId ?? selectedId ?? threads[0]?.id;
        if (id) handleSelect(id);
      },
      onArchive: () => handleArchive(),
      onTrash: () => handleTrash(),
      onUnread: () => handleMarkUnread(),
      onStar: () => handleStar(),
      onReply: () => {
        if (selectedId) setComposerMode("reply");
      },
      onReplyAll: () => {
        if (selectedId) setComposerMode("reply-all");
      },
      onCompose: () => setComposeOpen(true),
      onSearch: () => searchRef.current?.focus(),
      onEscape: () => {
        if (composerMode) {
          setComposerMode(null);
          return;
        }
        // Compose window owns Escape (minimize / restore)
        if (composeOpen) return;
        if (mobileDetail) {
          clearSelection();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clearSelection,
      composeOpen,
      composerMode,
      focusedId,
      handleSelect,
      mobileDetail,
      moveFocus,
      selectedId,
      selectedThread,
      threads,
    ],
  );

  useInboxKeyboard(keyboardHandlers);

  const latestEmail = thread[thread.length - 1] ?? email;

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          className={`flex h-full min-h-0 w-full flex-col lg:w-96 lg:shrink-0 ${
            mobileDetail ? "hidden lg:flex" : "flex"
          }`}
        >
          <ThreadList
            threads={threads}
            selectedId={selectedId}
            focusedId={focusedId}
            query={query}
            view={view}
            loading={loadingThreads}
            syncing={syncing}
            searchRef={searchRef}
            onSelect={handleSelect}
            onQueryChange={setQuery}
            onViewChange={(next) => {
              setView(next);
              setThreads([]);
              clearSelection();
            }}
            onCompose={() => setComposeOpen(true)}
            onStarToggle={handleStarToggle}
            onSync={() => void handleSync()}
            onLogout={() => void handleLogout()}
          />
        </div>

        <div
          className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950 ${
            mobileDetail ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="hidden items-center justify-end gap-2 border-b border-zinc-200 px-4 py-2 lg:flex dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="motion-press inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
            >
              {syncing ? "Syncing..." : "Sync from Resend"}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="motion-press inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>

          {selectedThread ? (
            <ActionToolbar
              isStarred={selectedThread.isStarred}
              isArchived={selectedThread.isArchived || view === "archived"}
              onArchive={handleArchive}
              onTrash={handleTrash}
              onStar={handleStar}
              onMarkUnread={handleMarkUnread}
              onReply={() => setComposerMode("reply")}
              onReplyAll={() => setComposerMode("reply-all")}
              onForward={() => setComposerMode("forward")}
              onBack={() => clearSelection()}
            />
          ) : null}

          <EmailView
            email={email}
            thread={thread}
            loading={loadingEmail}
            refreshing={refreshingEmail}
          />

          <ReplyComposer
            emailId={selectedId}
            latestEmail={latestEmail}
            mode={composerMode}
            signatureHtml={settings?.signatureHtml ?? ""}
            onSent={handleSent}
            onClose={() => setComposerMode(null)}
          />
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        signatureHtml={settings?.signatureHtml ?? ""}
        onClose={() => setComposeOpen(false)}
        onSent={handleSent}
      />

      <UndoToast
        state={undo}
        onUndo={() => void handleUndo()}
        onDismiss={() => setUndo(null)}
      />
    </>
  );
}
