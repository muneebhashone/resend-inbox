import Link from "next/link";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-transparent">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href="/"
          className="min-h-10 inline-flex items-center text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Resend Inbox
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/settings"
            className="motion-press inline-flex min-h-10 items-center rounded-md px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            Settings
          </Link>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
