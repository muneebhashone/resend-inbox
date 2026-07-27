import Link from "next/link";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-transparent">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/50">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Resend Inbox
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/settings"
            className="rounded-md px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/80 dark:hover:text-zinc-100"
          >
            Settings
          </Link>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
