"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposeModal } from "@/components/inbox/compose-modal";
import { EmailView } from "@/components/inbox/email-view";
import { ReplyComposer } from "@/components/inbox/reply-composer";
import { ThreadList } from "@/components/inbox/thread-list";
import type { Email, Settings, ThreadSummary } from "@/lib/types";

async function fetchThreads(search: string): Promise<ThreadSummary[]> {
  const params = search ? `?q=${encodeURIComponent(search)}` : "";
  const response = await fetch(`/api/emails${params}`);
  const data = (await response.json()) as { threads: ThreadSummary[] };
  return data.threads;
}

async function fetchSettings(): Promise<Settings> {
  const response = await fetch("/api/settings");
  const data = (await response.json()) as { settings: Settings };
  return data.settings;
}

async function fetchEmail(id: string): Promise<{ email: Email; thread: Email[] } | null> {
  const response = await fetch(`/api/emails/${id}`);
  if (!response.ok) return null;
  return (await response.json()) as { email: Email; thread: Email[] };
}

export function InboxApp() {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState<Email | null>(null);
  const [thread, setThread] = useState<Email[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [query, setQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const initialLoadDone = useRef(false);

  const refreshThreads = useCallback(async (search = query) => {
    setLoadingThreads(true);
    const nextThreads = await fetchThreads(search);
    setThreads(nextThreads);
    setLoadingThreads(false);
  }, [query]);

  const openEmail = useCallback(async (id: string) => {
    setLoadingEmail(true);
    const data = await fetchEmail(id);
    if (data) {
      setEmail(data.email);
      setThread(data.thread);
      await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    }
    setLoadingEmail(false);
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    void (async () => {
      const [nextThreads, nextSettings] = await Promise.all([
        fetchThreads(""),
        fetchSettings(),
      ]);
      setThreads(nextThreads);
      setSettings(nextSettings);
      setLoadingThreads(false);
    })();
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;

    const timeout = setTimeout(() => {
      void refreshThreads(query);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, refreshThreads]);

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    await refreshThreads();
    if (selectedId) {
      await openEmail(selectedId);
    }
    setSyncing(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    void openEmail(id);
  }

  function handleSent() {
    void refreshThreads();
    if (selectedId) {
      void openEmail(selectedId);
    }
  }

  return (
    <>
      <div className="flex w-full flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex items-center justify-end gap-2 border-b border-zinc-200 px-4 py-2 lg:hidden dark:border-zinc-800">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
          >
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Logout
          </button>
        </div>

        <ThreadList
          threads={threads}
          selectedId={selectedId}
          query={query}
          loading={loadingThreads}
          onSelect={handleSelect}
          onQueryChange={setQuery}
          onCompose={() => setComposeOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden items-center justify-end gap-2 border-b border-zinc-200 px-4 py-2 lg:flex dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900"
            >
              {syncing ? "Syncing..." : "Sync from Resend"}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>

          <EmailView email={email} thread={thread} loading={loadingEmail} />
          <ReplyComposer
            emailId={selectedId}
            signatureHtml={settings?.signatureHtml ?? ""}
            onSent={handleSent}
          />
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        signatureHtml={settings?.signatureHtml ?? ""}
        onClose={() => setComposeOpen(false)}
        onSent={handleSent}
      />
    </>
  );
}
